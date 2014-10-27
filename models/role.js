module.exports = function(sequelize, DataTypes) {
  var Role = sequelize.define('Role', {
    name: { 
	type:  DataTypes.STRING,
	allowNull: false
    }
  }, {
    associate: function(models) {
	Role.hasMany(models.User);
    }
  })

  return Role
}
