const db = require('./../database/connecttion');
const bank = require('./../database/bank');


db.sync().then(async () => {
    var bankname = "NH01";
    var find = await bank.findBank(bankname);
    if (!find) {
        await bank.createBank(bankname, '123456', "");
    }

    var bankname = "NBV";
    var find = await bank.findBank(bankname);
    if (!find) {
        await bank.createBank(bankname, '123456', 'https://doanweb2-2020.herokuapp.com');
    }
});
