

exports.task_creation_notif = (from_name, project_name)=>{
    return `${from_name} created new task in "${project_name}" for you`
}

exports.project_creation_notif_for_manager = (from_name, project_name)=>{
    return `You are added as a project manager for new project ${project_name} by ${from_name}`
}

exports.project_creation_notif_for_user = (from_name, project_name)=>{
    return `You are added as a project resource for new project ${project_name} by ${from_name}`
}

exports.project_completion_notif_for_admin = (from_name, project_name)=>{
    return `${from_name} updated ${project_name} as completed. Please verify the action`
}

exports.project_completion_notif_for_manager = (from_name, project_name)=>{
    return `${from_name} updated ${project_name} as completed.`
}

exports.project_deadline_for_manager = (project_name)=>{
    return `${project_name} deadline alert. Please check the status of your project`
}

exports.weekly_report_remainder_for_manager = ()=>{
    return `Gentle reminder to share the weekly reports`
}

