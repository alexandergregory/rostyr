module.exports = function(sequelize, DataTypes) {
  var Position = sequelize.define('Position', {
    name: {
        type:  DataTypes.STRING,
        allowNull: false
    }
  }, {
    associate: function(models) {
	Position.belongsTo(models.User);
	Position.hasMany(models.Staff);
    }
  })

  return Position
}
