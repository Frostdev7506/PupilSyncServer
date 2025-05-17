var DataTypes = require("sequelize").DataTypes;
var _SequelizeMeta = require("./sequelizeMeta");

function initModels(sequelize) {
  var SequelizeMeta = _SequelizeMeta(sequelize, DataTypes);


  return {
    SequelizeMeta,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
