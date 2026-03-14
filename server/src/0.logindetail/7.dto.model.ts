import { Sequelize, Model, DataTypes } from "sequelize";
import { ILoginDetail, roleList } from "./0.model";

export class DTOLoginDetail extends Model {
  Id?: number;
  name!: string;
  adhaar!: string;
  password!: string;
  role!: string | number | boolean;
}

export const initDTOLoginDetailModel = (
  schemaName: string,
  sequelize: Sequelize
) => {
  DTOLoginDetail.init(
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
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      schema: schemaName,
      tableName: "logindetail",
      timestamps: false,
    }
  );
};
