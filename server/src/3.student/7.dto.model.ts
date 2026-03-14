import { Sequelize, Model, DataTypes } from "sequelize";
import { IStudent } from "./0.model";

export class DTOStudent extends Model {
  Id?: number;
  name!: string;
  adhaar!: string;
  school?: number;
  standard?: number;
}

export const initDTOStudentModel = (
  schemaName: string,
  sequelize: Sequelize
) => {
  DTOStudent.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      adhaar: {
        type: DataTypes.STRING,
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
    },
    {
      sequelize,
      schema: schemaName,
      tableName: "student",
      timestamps: false,
    }
  );
};
