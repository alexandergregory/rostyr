module.exports = function(sequelize, DataTypes) {
    var Client = sequelize.define('Client', {
	name: { 
	    type: DataTypes.STRING, 
	}
    }, {
	associate: function(models) {
	    Client.hasMany(models.Job);
	    Client.hasMany(models.User);
	}
    })
    return Client
}
