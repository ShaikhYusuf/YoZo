import { Sequelize, Model, DataTypes } from "sequelize";
import { ISchoolStandard } from "./0.model";

export class DTOSchoolStandard extends Model {
  Id?: number;
  school?: number;
  standard?: number;
}

export const initDTOSchoolStandardModel = (
  schemaName: string,
  sequelize: Sequelize
) => {
  DTOSchoolStandard.init(
    {
      Id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        autoIncrement: true,
        primaryKey: true,
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
      tableName: "schoolstandard",
      timestamps: false,
    }
  );
};
