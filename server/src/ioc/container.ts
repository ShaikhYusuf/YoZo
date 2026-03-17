import { Container } from "inversify";
import TYPES from "./types";

import { BaseController } from "../common/base-controller";
import { ILogger, LoggerService } from "../common/service/logger.service";
import { ServiceTenant } from "../common/service/tenant.service";
import { RequestContextProvider } from "../common/service/request-context.service";
import { MiddlewareProvider } from "../common/service/middleware.service";
import { SocketService } from "../common/service/socket.service";
import { Validate } from "../common/validate";

import { ControllerLoginDetail } from "../0.logindetail/2.controller";
import { IServiceLoginDetail } from "../0.logindetail/3.service.model";
import { ServiceLoginDetailImpl } from "../0.logindetail/4.service";
import { IRepoLoginDetail } from "../0.logindetail/5.repo.model";
import { RepoLoginDetailImpl } from "../0.logindetail/6.repo";

import { ControllerSchool } from "../1.school/2.controller";
import { IServiceSchool } from "../1.school/3.service.model";
import { ServiceSchoolImpl } from "../1.school/4.service";
import { IRepoSchool } from "../1.school/5.repo.model";
import { RepoSchoolImpl } from "../1.school/6.repo";

import { ControllerSchoolStandard } from "../2.schoolstandard/2.controller";
import { IServiceSchoolStandard } from "../2.schoolstandard/3.service.model";
import { ServiceSchoolStandardImpl } from "../2.schoolstandard/4.service";
import { IRepoSchoolStandard } from "../2.schoolstandard/5.repo.model";
import { RepoSchoolStandardImpl } from "../2.schoolstandard/6.repo";

import { ControllerStudent } from "../3.student/2.controller";
import { IServiceStudent } from "../3.student/3.service.model";
import { ServiceStudentImpl } from "../3.student/4.service";
import { IRepoStudent } from "../3.student/5.repo.model";
import { RepoStudentImpl } from "../3.student/6.repo";

import { ControllerProgress } from "../4.progress/2.controller";
import { IServiceProgress } from "../4.progress/3.service.model";
import { ServiceProgressImpl } from "../4.progress/4.service";
import { IRepoProgress } from "../4.progress/5.repo.model";
import { RepoProgressImpl } from "../4.progress/6.repo";

import { ControllerStandard } from "../5.standard/2.controller";
import { IServiceStandard } from "../5.standard/3.service.model";
import { ServiceStandardImpl } from "../5.standard/4.service";
import { IRepoStandard } from "../5.standard/5.repo.model";
import { RepoStandardImpl } from "../5.standard/6.repo";

import { ControllerSubject } from "../6.subject/2.controller";
import { IServiceSubject } from "../6.subject/3.service.model";
import { ServiceSubjectImpl } from "../6.subject/4.service";
import { IRepoSubject } from "../6.subject/5.repo.model";
import { RepoSubjectImpl } from "../6.subject/6.repo";

import { ControllerLesson } from "../7.lesson/2.controller";
import { IServiceLesson } from "../7.lesson/3.service.model";
import { ServiceLessonImpl } from "../7.lesson/4.service";
import { IRepoLesson } from "../7.lesson/5.repo.model";
import { RepoLessonImpl } from "../7.lesson/6.repo";
import { ControllerLessonSection } from "../7.lessonsection/2.controller";
import { IServiceLessonSection } from "../7.lessonsection/3.service.model";
import { ServiceLessonSectionImpl } from "../7.lessonsection/4.service";
import { RepoLessonSectionImpl } from "../7.lessonsection/6.repo";
import { IRepoLessonSection } from "../7.lessonsection/5.repo.model";
import { ControllerChat } from "../8.chat/2.controller";
import { IServiceChat } from "../8.chat/3.service.model";
import { ServiceChatImpl } from "../8.chat/4.service";

import { ControllerAi } from "../9.ai/2.controller";

import { ControllerGamification } from "../10.gamification/2.controller";
import { IServiceGamification } from "../10.gamification/3.service.model";
import { ServiceGamificationImpl } from "../10.gamification/4.service";
import { IRepoGamification } from "../10.gamification/5.repo.model";
import { RepoGamificationImpl } from "../10.gamification/6.repo";

const container = new Container();
container.bind<ILogger>(TYPES.LoggerService).to(LoggerService);
container.bind(ServiceTenant).toSelf().inSingletonScope();
container.bind(RequestContextProvider).toSelf().inSingletonScope();
container.bind(MiddlewareProvider).toSelf().inSingletonScope();
container.bind<Validate>(Validate).to(Validate);

container
  .bind<ControllerLoginDetail>(TYPES.ControllerLoginDetail)
  .to(ControllerLoginDetail);
container
  .bind<IServiceLoginDetail>(TYPES.ServiceLoginDetail)
  .to(ServiceLoginDetailImpl);
container.bind<IRepoLoginDetail>(TYPES.RepoLoginDetail).to(RepoLoginDetailImpl);

container.bind<ControllerSchool>(TYPES.ControllerSchool).to(ControllerSchool);
container.bind<IServiceSchool>(TYPES.ServiceSchool).to(ServiceSchoolImpl);
container.bind<IRepoSchool>(TYPES.RepoSchool).to(RepoSchoolImpl);

container
  .bind<ControllerSchoolStandard>(TYPES.ControllerSchoolStandard)
  .to(ControllerSchoolStandard);
container
  .bind<IServiceSchoolStandard>(TYPES.ServiceSchoolStandard)
  .to(ServiceSchoolStandardImpl);
container
  .bind<IRepoSchoolStandard>(TYPES.RepoSchoolStandard)
  .to(RepoSchoolStandardImpl);

container
  .bind<ControllerStudent>(TYPES.ControllerStudent)
  .to(ControllerStudent);
container.bind<IServiceStudent>(TYPES.ServiceStudent).to(ServiceStudentImpl);
container.bind<IRepoStudent>(TYPES.RepoStudent).to(RepoStudentImpl);

container
  .bind<ControllerProgress>(TYPES.ControllerProgress)
  .to(ControllerProgress);
container.bind<IServiceProgress>(TYPES.ServiceProgress).to(ServiceProgressImpl);
container.bind<IRepoProgress>(TYPES.RepoProgress).to(RepoProgressImpl);

container
  .bind<ControllerStandard>(TYPES.ControllerStandard)
  .to(ControllerStandard);
container.bind<IServiceStandard>(TYPES.ServiceStandard).to(ServiceStandardImpl);
container.bind<IRepoStandard>(TYPES.RepoStandard).to(RepoStandardImpl);

container
  .bind<ControllerSubject>(TYPES.ControllerSubject)
  .to(ControllerSubject);
container.bind<IServiceSubject>(TYPES.ServiceSubject).to(ServiceSubjectImpl);
container.bind<IRepoSubject>(TYPES.RepoSubject).to(RepoSubjectImpl);

container.bind<ControllerLesson>(TYPES.ControllerLesson).to(ControllerLesson);
container.bind<IServiceLesson>(TYPES.ServiceLesson).to(ServiceLessonImpl);
container.bind<IRepoLesson>(TYPES.RepoLesson).to(RepoLessonImpl);

container
  .bind<ControllerLessonSection>(TYPES.ControllerLessonSection)
  .to(ControllerLessonSection);
container
  .bind<IServiceLessonSection>(TYPES.ServiceLessonSection)
  .to(ServiceLessonSectionImpl);
container
  .bind<IRepoLessonSection>(TYPES.RepoLessonSection)
  .to(RepoLessonSectionImpl);

container.bind<ControllerChat>(TYPES.ControllerChat).to(ControllerChat);
container.bind<IServiceChat>(TYPES.ServiceChat).to(ServiceChatImpl);

container.bind<ControllerAi>(TYPES.ControllerAi).to(ControllerAi);

container.bind<ControllerGamification>(TYPES.ControllerGamification).to(ControllerGamification);
container.bind<IServiceGamification>(TYPES.ServiceGamification).to(ServiceGamificationImpl);
container.bind<IRepoGamification>(TYPES.RepoGamification).to(RepoGamificationImpl);
container.bind(SocketService).toSelf().inSingletonScope();

export { container };
