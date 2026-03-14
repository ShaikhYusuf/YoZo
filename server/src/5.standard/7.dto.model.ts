import { Sequelize, Model, DataTypes } from "sequelize";
import { IStandard } from "./0.model";

export class DTOStandard extends Model {
  Id?: number;
  name!: string;
}

export const initDTOStandardModel = (
  schemaName: string,
  sequelize: Sequelize
) => {
  DTOStandard.init(
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
    },
    {
      sequelize,
      schema: schemaName,
      tableName: "standard",
      timestamps: false,
    }
  );
};
