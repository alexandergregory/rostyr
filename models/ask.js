module.exports = function(sequelize, DataTypes) {
  var Ask = sequelize.define('Ask', {
    dateEmailed: {
        type:  DataTypes.DATE,
    },
    dateRespond: {
        type: DataTypes.DATE,
    },
    acceptToken: {
	type: DataTypes.STRING,
    },
    declineToken: {
	type: DataTypes.STRING,
    },
    accepted: {
	type: DataTypes.BOOLEAN,
    },
  }, {
    associate: function(models) {
	Ask.belongsTo(models.Job);
        Ask.belongsTo(models.Booking);
    }
  })

  return Ask
}
