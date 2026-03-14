import { Sequelize, Model, DataTypes } from "sequelize";
import { IProgress } from "./0.model";

export class DTOProgress extends Model {
  Id?: number;
  quiz!: number;
  fillblanks!: number;
  truefalse!: number;
  school?: number;
  standard?: number;
  student?: number;
  subject?: number;
  lesson?: number;
  lessonsection?: number;
}

export const initDTOProgressModel = (
  schemaName: string,
  sequelize: Sequelize
) => {
  DTOProgress.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        autoIncrement: true,
        primaryKey: true,
      },
      quiz: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fillblanks: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      truefalse: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      school: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            schema: schemaName,
            tableName: "school",
          },
          key: "Id",
        },
      },
      standard: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            schema: schemaName,
            tableName: "standard",
          },
          key: "Id",
        },
      },
      student: {
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
      subject: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: {
            schema: schemaName,
            tableName: "subject",
          },
          key: "Id",
        },
      },
      lesson: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: {
            schema: schemaName,
            tableName: "lesson",
          },
          key: "Id",
        },
      },
      lessonsection: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: {
            schema: schemaName,
            tableName: "lessonsection",
          },
          key: "Id",
        },
      },
    },
    {
      sequelize,
      schema: schemaName,
      tableName: "progress",
      timestamps: false,
    }
  );
};
