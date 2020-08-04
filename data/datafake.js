const db = require('./../database/connecttion');
const bank = require('./../database/bank');


db.sync().then(async () => {
    var bankname = "banktest";
    var find = await bank.findBank(bankname);
    if (!find) {
        await bank.createBank(bankname, '123456');
    }

});
