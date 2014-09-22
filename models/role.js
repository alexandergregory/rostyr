module.exports = function(sequelize, DataTypes) {
    var Role = sequelize.define('Role', {
	role: { 
	    type: DataTypes.STRING, 
	    allowNull: false, 
	}
    }, {
	associate: function(models) {
	    Role.hasMany(models.User)
	}
    })
    return Role
}
