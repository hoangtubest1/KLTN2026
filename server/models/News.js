const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const News = sequelize.define('News', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.TEXT('long'), allowNull: true },
    image: { type: DataTypes.STRING(500), allowNull: true },
    publishedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
    tableName: 'news',
    timestamps: true,
});

module.exports = News;
