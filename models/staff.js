module.exports = function(sequelize, DataTypes) {
    var Staff = sequelize.define('Staff', {
	firstName: {
            type: DataTypes.STRING,
	},
	lastName: {
	    type: DataTypes.STRING,
	},
	email: {
	    type: DataTypes.STRING,
	    allowNull: false,
	},
	phone: {
	    type: DataTypes.STRING,
	},
    }, {
	associate: function(models) {
            Staff.belongsTo(models.User);
	    Staff.hasMany(models.Position);
	}
    })

    return Staff
}
