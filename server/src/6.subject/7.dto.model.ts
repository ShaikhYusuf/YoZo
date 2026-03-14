import { Sequelize, Model, DataTypes } from "sequelize";
import { ISubject } from "./0.model";

export class DTOSubject extends Model {
  Id?: number;
  name!: string;
  standard?: number;
}

export const initDTOSubjectModel = (
  schemaName: string,
  sequelize: Sequelize
) => {
  DTOSubject.init(
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
      tableName: "subject",
      timestamps: false,
    }
  );
};
