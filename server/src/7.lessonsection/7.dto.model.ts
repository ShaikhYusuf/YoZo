import { Sequelize, Model, DataTypes } from "sequelize";
import { ILessonSection } from "./0.model";

export class DTOLessonSection extends Model {
  Id?: number;
  name!: string;
  explanation!: string;
  quiz!: string;
  fillblanks!: string;
  truefalse!: string;
  subject?: number;
  lesson?: number;
}

export const initDTOLessonSectionModel = (
  schemaName: string,
  sequelize: Sequelize
) => {
  DTOLessonSection.init(
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
      explanation: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      quiz: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      fillblanks: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      truefalse: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      subject: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
        allowNull: false,
        references: {
          model: {
            schema: schemaName,
            tableName: "lesson",
          },
          key: "Id",
        },
      },
    },
    {
      sequelize,
      schema: schemaName,
      tableName: "lessonsection",
      timestamps: false,
    }
  );
};
