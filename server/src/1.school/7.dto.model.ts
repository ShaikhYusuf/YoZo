import { Sequelize, Model, DataTypes } from "sequelize";
import { ISchool } from "./0.model";

export class DTOSchool extends Model {
  Id?: number;
  name!: string;
  address!: string;
}

export const initDTOSchoolModel = (
  schemaName: string,
  sequelize: Sequelize
) => {
  DTOSchool.init(
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
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      schema: schemaName,
      tableName: "school",
      timestamps: false,
    }
  );
};
