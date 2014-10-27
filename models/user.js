var bcrypt = require('bcryptjs');

module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define('User', {
	firstName: { 
	    type: DataTypes.STRING, 
	    allowNull: false, 
	},
	lastName: {
	    type: DataTypes.STRING,
	    allowNull: false,
	},
	email: { 
	    type: DataTypes.STRING, 
	    unique: true,
	    allowNull: false,
	    validate: { isEmail: { msg: 'Please enter a valid email address' } },
	},
	token: {
	    type: DataTypes.STRING,
	    unique: true,
	    allowNull: false,
	},
	pass: {
	    type: DataTypes.STRING,
	    unique: true,
	},
	active: {
	    type: DataTypes.BOOLEAN,
	    defaultValue: false,
	}
    }, {
	instanceMethods: {
	    generateHash: function(password) {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
	    },
	    validPassword: function(password) {
		return bcrypt.compareSync(password, this.pass);
            },
	},
	associate: function(models) {
	    User.hasMany(models.Role);
	    User.hasMany(models.Job);
	    User.hasMany(models.Staff);
	    User.hasMany(models.Position);
	}
    })
    return User
}
