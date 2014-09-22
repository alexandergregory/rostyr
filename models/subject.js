module.exports = function(sequelize, DataTypes) {
  var Subject = sequelize.define('Subject', {
    name: { 
	type:  DataTypes.STRING,
    }
  }, {
    associate: function(models) {
	Subject.hasMany(models.User)
    }
  })

  return Subject
}
