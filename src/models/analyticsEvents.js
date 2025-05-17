const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('AnalyticsEvents', {
    eventId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'event_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'user_id',
      comment: "User who performed the action (if authenticated)"
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'session_id',
      comment: "Session identifier for anonymous or authenticated users"
    },
    eventType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'event_type',
      comment: "Type of event (e.g., 'page_view', 'login', 'course_enrollment')"
    },
    eventCategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'event_category',
      comment: "Category of event (e.g., 'authentication', 'content', 'assessment')"
    },
    eventAction: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'event_action',
      comment: "Action performed (e.g., 'click', 'submit', 'view')"
    },
    eventLabel: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'event_label',
      comment: "Additional label for the event"
    },
    eventValue: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'event_value',
      comment: "Numeric value associated with the event (if applicable)"
    },
    entityType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'entity_type',
      comment: "Type of entity this event relates to (e.g., 'course', 'lesson')"
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'entity_id',
      comment: "ID of the related entity"
    },
    url: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: "URL where the event occurred"
    },
    referrer: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: "Referrer URL"
    },
    userAgent: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      field: 'user_agent'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address'
    },
    deviceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'device_type',
      comment: "Type of device (e.g., 'desktop', 'mobile', 'tablet')"
    },
    operatingSystem: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'operating_system'
    },
    browser: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    additionalData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'additional_data',
      comment: "Additional event-specific data"
    },
    eventTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'event_timestamp'
    }
  }, {
    sequelize,
    tableName: 'analytics_events',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "analytics_events_pkey",
        unique: true,
        fields: [
          { name: "event_id" },
        ]
      },
      {
        name: "idx_analytics_events_user_id",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "idx_analytics_events_session_id",
        fields: [
          { name: "session_id" },
        ]
      },
      {
        name: "idx_analytics_events_event_type",
        fields: [
          { name: "event_type" },
        ]
      },
      {
        name: "idx_analytics_events_event_timestamp",
        fields: [
          { name: "event_timestamp" },
        ]
      },
      {
        name: "idx_analytics_events_entity_type_id",
        fields: [
          { name: "entity_type" },
          { name: "entity_id" },
        ]
      }
    ]
  });
};
