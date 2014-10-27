module.exports = function(sequelize, DataTypes) {
  var Job = sequelize.define('Job', {
    date: {
        type: DataTypes.DATE,
    },
    pax: {
	type: DataTypes.INTEGER,
    }
  }, {
    associate: function(models) {
	Job.belongsTo(models.Client);
	Job.belongsTo(models.Location);
	Job.belongsTo(models.EventType);
	Job.hasMany(models.Booking);
    }
  })

  return Job
}
