const jwt = require('jsonwebtoken');
const rand = require("random-key");
const express = require('express');
const app = express();
const db = require('./database/connecttion');
const asyncHandler = require('express-async-handler');
const bank = require('./database/bank');
const bodyParser = require('body-parser');
const Bank = require('./database/bank');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/createbank', asyncHandler(async (req, res) => {
    let auth = "lqvinh243";
    let bank = req.headers["auth"];
    let { bankname, password, base_url } = req.body;
    if (!bank || bank !== auth) {
        return res.json({ "statusCode": 401, "err": "Cannot authencation!" });
    }
    if (!bankname || !password) {
        return res.json({ "statusCode": 401, "err": "Invalid input!" });
    }
    const find = await bank.findBank(bankname);
    const findurl = await bank.findBank(base_url);
    if (find || base_url) return res.json({ "statusCode": 401, "err": "Bank or Base_Url already!" });
    await bank.createBank(bankname, password, base_url);
    res.json({ "statusCode": 200, "message": "Register bankname successs!" });
}));

app.post('/getAllbank', asyncHandler(async (req, res) => {
    let bankname = req.headers["bankname"];
    let password = req.headers["password"];
    if (!bankname || !password) {
        return res.json({ "statusCode": 401, "err": "Invalid name or password" });
    }

    const find = await bank.findBank(bankname);
    if (!find || !bank.comparePassword(password, find.password)) {
        return res.json({ "statusCode": 401, "error": "Cant not verify bank" });
    }
    const findall = await bank.findAllBank(bankname);
    res.json({ "statusCode": 200, arrbank: findall });
}));

app.post('/sign', asyncHandler(async (req, res) => {
    let { bankname, password } = req.body;
    if (!bankname || !password) {
        return res.json({ "statusCode": 401, "error": "Cant not verify bank" });
    }
    const find = await bank.findBank(bankname);
    if (!find || !bank.comparePassword(password, find.password)) {
        return res.json({ "statusCode": 401, "error": "Cant not verify bank" });
    }
    var privateKey = rand.generate();
    jwt.sign({ bank: find.bankname }, privateKey, { expiresIn: '7m' }, function (err, token) {
        if (err) {
            return res.json({ "statusCode": 404, "err": err });
        }
        res.json({
            "statusCode": 200,
            "token": token,
            "privateKey": privateKey
        });
    });
}));

const axios = require('axios');

app.post('/verify', (req, res) => {
    var token = req.headers['token'];
    let { privateKey, bankname, bankselect, money, idsend, content, idrecive } = req.body;
    if (!token) {
        return res.json({ "statusCode": 401, "err": "Invalid token" });
    }

    jwt.verify(token, privateKey, async (err, decoded) => {
        if (err) {
            return res.json({ "statusCode": 401, "err": err });
        }

        console.log(decoded.bank !== bankname);
        if (decoded.bank !== req.body.bankname) {
            return res.json({ "statusCode": 401, "err": "Invalid token" });
        }

        const findbankselect = await bank.findBank(bankselect);
        const findbanksend = await bank.findBank(decoded.bank);
        if (!findbankselect) {
            return res.json({ "statusCode": 401, "err": "Can not find bank select" });
        }

        if (findbanksend.storageMoney < parseInt(money)) {
            return res.json({ "statusCode": 401, "err": "Money not enough" });
        }

        let t = await db.transaction();
        try {
            var resultaxios;
            var error;
            let moneyselect = parseInt(findbankselect.storageMoney) + parseInt(money);
            let moneysend = parseInt(findbanksend.storageMoney) - parseInt(money);
            console.log(moneyselect);
            console.log(moneysend);
            const update1 = await Bank.updateMoney(bankselect, moneyselect, t);
            const update2 = await Bank.updateMoney(decoded.bank, moneysend, t);
            if (update1[0] === 0 || update2[0] === 0) {
                throw "Cannot update money in storageMoney";
            }
            if (findbankselect.bankname === "NBV") {
                await axios({
                    method: 'post',
                    url: `${findbankselect.base_url}/gettoken`,
                    headers: {
                        email: 'lqvinh243@gmail.com',
                        password: '123456'
                    }
                }).then(async (result) => {
                    if (result.status !== 200) {
                        error = true;
                    }
                    resultaxios = result.data;
                    if (result.data.statusCode != 200) {
                        //do nothing
                    }
                    else {
                        let tokenget = result.data.token;
                        let privateKeyToken = result.data.privateKey;

                        await axios({
                            method: 'post',
                            url: `${findbankselect.base_url}/updatemoney`,
                            data: {
                                bankname,
                                money,
                                content,
                                idsend,
                                idrecive
                            },
                            headers: {
                                email: 'lqvinh243@gmail.com',
                                token: tokenget,
                                privatekey: privateKeyToken
                            }
                        }).then((result2) => {
                            resultaxios = result2.data;
                            if (result.status !== 200) {
                                error = true;
                            }
                        });
                    }
                })
            }
            if (error) {
                throw "Cannot get api";
            }
            if (resultaxios.statusCode != 200) {
                throw resultaxios.message;
            }
            await t.commit();
            return res.json({ "statusCode": 200, "message": "Chuyển tiền thành công!" });
        } catch (err) {
            console.log(err);
            await t.rollback();
            res.json({ "statusCode": 404, "message": "Chuyển tiền thất bại!", "Detail": err });
        }
    });
})

db.sync().then(() => {
    app.listen(process.env.PORT || 3000);
})