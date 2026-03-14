import { Sequelize, Model, DataTypes } from "sequelize";

export class DTOGamification extends Model {
  Id?: number;
  studentId!: number;
  xp?: number;
  level?: number;
  badges?: string[];
  streakDays?: number;
  lastActive?: string | Date;
}

export const initDTOGamificationModel = (
  schemaName: string,
  sequelize: Sequelize
) => {
  DTOGamification.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        autoIncrement: true,
        primaryKey: true,
      },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            schema: schemaName,
            tableName: "student",
          },
          key: "Id",
        },
      },
      xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      badges: {
        type: DataTypes.JSON, // Using JSON for string arrays to avoid dialect specific issues
        defaultValue: [],
      },
      streakDays: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastActive: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      schema: schemaName,
      tableName: "gamification",
      timestamps: false,
    }
  );
};
