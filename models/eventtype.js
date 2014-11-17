module.exports = function(sequelize, DataTypes) {
  var EventType = sequelize.define('EventType', {
    name: {
        type: DataTypes.STRING,
    }
  }, {
    associate: function(models) {
	EventType.hasMany(models.Job);
	EventType.hasMany(models.User);
    }
  })

  return EventType
}
