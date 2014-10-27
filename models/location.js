module.exports = function(sequelize, DataTypes) {
  var Location = sequelize.define('Location', {
    name: {
        type:  DataTypes.STRING,
    }
  }, {
    associate: function(models) {
	Location.hasMany(models.Job);
    }
  })

  return Location
}
