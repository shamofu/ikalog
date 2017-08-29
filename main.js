require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;


const splaNet_url = 'https://app.splatoon2.nintendo.net';
const api = axios.create({
    baseURL: `${splaNet_url}/api/`,
    headers: {'Cookie': `iksm_session=${process.env.IKSM_SESSION}`},
    validateStatus: null
});

mongoose.connect(process.env.MONGODB_URI, {
    useMongoClient: true
});
const db = mongoose.connection;
db.on('error', console.error.bind('connection error'));
db.once('open', async function() {
    const res = await api.get('results');
    if (res['status'] == 200) {
        const battleSchema = mongoose.Schema({ data: Object });
        const Battles = mongoose.model('Battles', battleSchema);
        for (let elem of res['data']['results'].reverse()) {
            console.log(`checking ${elem['battle_number']}`);
            let battle = await Battles.findOne({'data.battle_number': elem['battle_number']}).exec();
            if (!battle) {
                console.log(` storing ${elem['battle_number']}`);
                const eachRes = await api.get(`results/${parseInt(elem['battle_number'])}`);
                if (eachRes['status'] == 200) {
                    battle = new Battles({ data: eachRes['data'] });
                    await battle.save();
                    console.log(`  stored ${elem['battle_number']}`);
                } else {
                    console.log(`  failed ${elem['battle_number']}`);
                }
            } else {
                console.log(`aborting ${elem['battle_number']}`);
            }
        }
    }
    db.close();
});
