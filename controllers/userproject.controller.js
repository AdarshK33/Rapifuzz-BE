const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
let Validator = require('validatorjs');
const ErrorHandler = require("../utils/errorHandler");
const bcrypt = require('bcryptjs')
const User = require("../models/user.model");
const Project = require("../models/project.model");
const Client = require("../models/client.model");
const DBValidation = require("../models/db_validation");
const { isEmpty, updateObj } = require("../utils/common");
const Task = require("../models/task.model");
const { createAppNotification } = require("./appnotification.controller");
const { project_creation_notif_for_manager, project_creation_notif_for_user, project_completion_notif_for_admin, project_completion_notif_for_manager } = require("../utils/notifMessageTemplate");
const UserProject = require("../models/user_project.model");




exports.create = catchAsyncErrors(async (req, res, next) => {
    // Validate request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    let validation = new Validator(req.body, {

        status: [{ 'in': ['Active', 'In-Active'] }]
    });
    // console.log(req.body.user_id, req.body.project_id, "checkUserProject")
    const roleData = await UserProject.isValidRole(req.body.user_id) //fetching from user table

    const checkSingleUser = await UserProject.isUsersValidByuserId(req.body.user_id) //FETCHING FROM user_projects
    //console.log(checkSingleUser, "checkSingleUser")

    const checkUserProject = await UserProject.isUsersValid(req.body.user_id, req.body.project_id) //FETCHING FROM user_projects
    const project_old_manager_id = await Project.getProjectManager_ByProject_id(req.body.project_id); //FETCHING FROM projects
    const checkCurrentProjectCount = await UserProject.isValidCurrentProject(project_old_manager_id) //its giving integger , fetching from user table

    if (checkUserProject) {
        //boolean
        return next(new ErrorHandler(`Sorry! given ${roleData} is already have same projects `, 400))
    }



    let errObj = null
    validation.checkAsync(null, () => {
        errObj = validation.errors.all()
        for (const errProp in errObj) {
            return next(new ErrorHandler(errObj[errProp], 400))
        }
    });


    if (!errObj) {
        // Create a Vendor
        const user_project_obj = new UserProject({
            project_id: req.body.project_id,
            user_id: req.body.user_id,
            status: req.body.status,

        });

        //checking role by user_id  user manager admin


        // Save user assigned Project in the database

        if (roleData === "user" && user_project_obj.status === 'Active') {
            const data = await UserProject.create(user_project_obj);
            const projectCountIncrement = await UserProject.updateProjectCountIncrement(user_project_obj);
            const userUpdate = await UserProject.getUserUpdate(user_project_obj);
            res.status(201).json({
                success: true,
                data,
                userUpdate,
                projectCountIncrement
            });
        }
        else if (roleData === "manager") {
            // console.log("hello 1")
            if (user_project_obj.status === 'Active' && checkSingleUser === 1) {
                //console.log("hello 2")
                const data = await UserProject.create(user_project_obj);
                const managerUpdate = await UserProject.getManagerUpdate(user_project_obj);
                const updateManagerProjectCountIncrement = await UserProject.updateManagerProjectCountIncrement(user_project_obj.user_id);
                const updateInActiveStatus = await UserProject.updateInActiveStatus(project_old_manager_id, user_project_obj.project_id);
                let updateManagerProjectCountDecrement;

                if (checkCurrentProjectCount !== 0) {
                    updateManagerProjectCountDecrement = await UserProject.updateManagerProjectCountDecrement(project_old_manager_id);
                }
                res.status(201).json({
                    success: true,
                    data,
                    managerUpdate,
                    updateInActiveStatus,
                    updateManagerProjectCountDecrement,
                    updateManagerProjectCountIncrement
                });
            }
            else if (user_project_obj.status === 'Active' && checkSingleUser >= 1) {
                // console.log("hello >1")
                const data = await UserProject.create(user_project_obj);
                const managerUpdate = await UserProject.getManagerUpdate(user_project_obj);
                const updateManagerProjectCountIncrement = await UserProject.updateManagerProjectCountIncrement(user_project_obj.user_id);
                const updateInActiveStatus = await UserProject.updateInActiveStatus(project_old_manager_id, user_project_obj.project_id);
                let updateManagerProjectCountDecrement;

                if (checkCurrentProjectCount !== 0) {
                    updateManagerProjectCountDecrement = await UserProject.updateManagerProjectCountDecrement(project_old_manager_id);
                }
                res.status(201).json({
                    success: true,
                    data,
                    managerUpdate,
                    updateInActiveStatus,
                    updateManagerProjectCountDecrement,
                    updateManagerProjectCountIncrement
                });
            }
            else if (checkUserProject && user_project_obj.status === 'Active') {
                // console.log("hello 3")
                const data = await UserProject.createManagerProject(user_project_obj);
                const managerUpdate = await UserProject.getManagerUpdate(user_project_obj);
                const updateActiveStatus = await UserProject.updateActiveStatus(user_project_obj.user_id, user_project_obj.project_id);
                const updateManagerProjectCountIncrement = await UserProject.updateManagerProjectCountIncrement(user_project_obj.user_id);
                const updateInActiveStatus = await UserProject.updateInActiveStatus(project_old_manager_id, user_project_obj.project_id);
                let updateManagerProjectCountDecrement;
                if (checkCurrentProjectCount !== 0) {
                    updateManagerProjectCountDecrement = await UserProject.updateManagerProjectCountDecrement(project_old_manager_id);
                }
                res.status(201).json({
                    success: true,
                    managerUpdate,
                    updateActiveStatus,
                    updateInActiveStatus,
                    updateManagerProjectCountDecrement,
                    updateManagerProjectCountIncrement
                });
            }
            else if (checkUserProject && user_project_obj.status === 'In-Active') {
                // console.log("hello 4")
                const updateInActiveStatus = await UserProject.updateInActiveStatus(project_old_manager_id, user_project_obj.project_id);
                let updateManagerProjectCountDecrement;
                if (checkCurrentProjectCount !== 0) {
                    updateManagerProjectCountDecrement = await UserProject.updateManagerProjectCountDecrement(project_old_manager_id);
                }
                const getManagerUpdate = await UserProject.getManagerUpdate(user_project_obj);
                const updateActiveStatus = await UserProject.updateActiveStatus(user_project_obj.user_id, user_project_obj.project_id);
                const updateManagerProjectCountIncrement = await UserProject.updateManagerProjectCountIncrement(user_project_obj.user_id);

                res.status(201).json({
                    success: true,
                    updateActiveStatus,
                    updateInActiveStatus,
                    getManagerUpdate,
                    updateManagerProjectCountIncrement,
                    updateManagerProjectCountDecrement
                });
            }

        }
    }

})


exports.getAssignProjectToUser = catchAsyncErrors(async (req, res, next) => {

    const user_id = req.params.user_id
    const user_data = await UserProject.getProjectByUserId(user_id);


    if (!user_data) {
        return next(new ErrorHandler(`Invalid user id`, 400))
    }

    res.status(200).json({
        status: true,
        data: user_data
    })
})



exports.getProjectsbyClientIdList = catchAsyncErrors(async (req, res, next) => {

    const client_id = req.params.client_id
    const project_data = await UserProject.getProjectlistByClientId(client_id)


    if (!project_data) {
        return next(new ErrorHandler(`Invalid user id`, 400))
    }

    res.status(200).json({
        status: true,
        data: project_data
    })
})


exports.update = catchAsyncErrors(async (req, res, next) => {
    // Validate request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    let validation = new Validator(req.body, {

        status: [{ 'in': ['Active', 'In-Active'] }]
    });
    const roleData = await UserProject.isValidRole(req.body.user_id)
    const checkUserProjectStatus = await UserProject.isValidUserProjectStatus(req.body.user_id, req.body.project_id) //fetching userProject table
    // console.log(checkUserProjectStatus, "checkUserProjectStatus 2")
    const checkCurrentProjectCount = await UserProject.isValidCurrentProject(req.body.user_id) //fetching user table 
    const projectManagerCount = await UserProject.getUserByProject_id(req.body.project_id) //fetching userProject table

    const oldProjectManager = await Project.getProjectManager_ByProject_id(req.body.project_id) //fetching project table
    // console.log(projectManagerCount, "projectManagerCount ")
    if (checkUserProjectStatus == req.body.status) {
        return next(new ErrorHandler(`Sorry! the ${roleData} is already ${checkUserProjectStatus} in this project`, 400));
    }
    //  const checkUserProject = await UserProject.isUsersValid(req.body.user_id, req.body.project_id)

    if (checkCurrentProjectCount == 0 && roleData == "user" && req.body.status == 'In-Active') {

        return next(new ErrorHandler(`Sorry! given user is already in in-Active `, 400))
    }

    if (roleData == "manager" && req.body.status == 'In-Active' && projectManagerCount >= 1) {

        return next(new ErrorHandler(`Sorry! Manager cannot be in-active for a project`, 401))
    }

    let errObj = null
    validation.checkAsync(null, () => {
        errObj = validation.errors.all()
        for (const errProp in errObj) {
            return next(new ErrorHandler(errObj[errProp], 400))
        }
    });

    if (!errObj) {
        // Create a Vendor
        const user_project_obj = new UserProject({
            project_id: req.body.project_id,
            user_id: req.body.user_id,
            status: req.body.status,

        });



        if (roleData == "user") {
            if (req.body.status == 'In-Active') {
                const data1 = await UserProject.unAssignProjectToUser(user_project_obj);
                const data2 = await UserProject.updateStatus(user_project_obj)
                const data3 = await UserProject.updateProjectCountDecrement(user_project_obj)

                res.status(201).json({
                    success: true,
                    data1,
                    data2,
                    data3,
                })
            }
            if (req.body.status == 'Active') {
                const data1 = await UserProject.getUserUpdate(user_project_obj)
                const data2 = await UserProject.updateStatus(user_project_obj)
                const data3 = await UserProject.updateProjectCountIncrement(user_project_obj)
                res.status(201).json({
                    success: true,
                    data1,
                    data2,
                    data3,
                })

            }
        }
        //for manager
        else if (roleData === "manager" && projectManagerCount >= 1) {
            if (req.body.status == 'Active') {
                //inactive old
                // -1,
                //status
                //project
                const getManagerUpdate = await UserProject.getManagerUpdate(user_project_obj);
                const updateInActiveStatus = await UserProject.updateInActiveStatus(oldProjectManager, req.body.project_id)
                const updateManagerProjectCountDecrement = await UserProject.updateManagerProjectCountDecrement(oldProjectManager)
                //active new
                const updateManagerProjectCountIncrement = await UserProject.updateManagerProjectCountIncrement(user_project_obj.user_id)
                const updateActiveStatus = await UserProject.updateActiveStatus(user_project_obj.user_id, req.body.project_id)

                res.status(201).json({
                    success: true,
                    getManagerUpdate,
                    updateInActiveStatus,
                    updateManagerProjectCountDecrement,
                    updateManagerProjectCountIncrement,
                    updateActiveStatus
                })
            }

        }


    }

})


