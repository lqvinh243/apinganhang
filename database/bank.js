const bcrypt = require('bcrypt');
const db = require('./connecttion');
const { Sequelize, Op, Model, DataTypes } = require("sequelize");

class Bank extends Model {
    static async findBank(bankname) {
        return await Bank.findOne({
            where: {
                bankname
            }
        });
    }

    static async findBaseurl(base_url) {
        return await Bank.findOne({
            where: {
                base_url
            }
        });
    }
    static hashPassword(password) {
        return bcrypt.hashSync(password, 10);
    }

    static comparePassword(password, hashPassword) {
        return bcrypt.compareSync(password, hashPassword);
    }

    static async createBank(bankname, password, base_url) {
        return await Bank.create({
            bankname,
            password: Bank.hashPassword(password),
            base_url
        });
    }

    static async findAllBank(name) {
        return await Bank.findAll({
            attributes: ['bankname'],
            where: {
                bankname: {
                    [Op.ne]: name
                }
            }
        });
    }

    static async updateMoney(bankname, money, t) {
        return await Bank.update({
            money
        }, {
            where: {
                bankname
            },
            transaction: t
        })
    }
};

Bank.init({
    bankname: {
        type: DataTypes.STRING,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    storageMoney: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    base_url: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    sequelize: db,
    modelName: 'bank',
});

module.exports = Bank;

