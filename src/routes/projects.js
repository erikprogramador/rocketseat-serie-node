const express = require('express')
const router = express.Router()

const Project = require('../models/project')
const Task = require('../models/task')

const authMiddleware = require('../middlewares/auth')

router.use(authMiddleware)

router.get('/', async function (request, response) {
  try {
    const projects = await Project.find().populate(['user', 'tasks'])

    return response.status(200).json({
      projects,
    })
  } catch (error) {
    return response.status(400).json({ message: error.message })
  }
})

router.get('/:projectId', async function (request, response) {
  try {
    const project = await Project.findById(request.params.projectId).populate([
      'user',
      'tasks',
    ])

    return response.status(200).json({
      project,
    })
  } catch (error) {
    return response.status(400).json({ message: error.message })
  }
})

router.post('/', async function (request, response) {
  try {
    const { title, description, tasks } = request.body
    const project = await Project.create({
      title,
      description,
      user: request.userId,
    })

    await Promise.all(
      tasks.map(async task => {
        const projectTask = new Task({
          ...task,
          project: project._id,
        })

        await projectTask.save()
        project.tasks.push(projectTask)
      })
    )

    await project.save()

    return response.status(201).json({
      project,
    })
  } catch (error) {}
})

router.put('/:projectId', async function (request, response) {
  try {
    const { title, description, tasks } = request.body
    const project = await Project.findByIdAndUpdate(
      request.params.projectId,
      {
        title,
        description,
      },
      { new: true }
    )

    project.tasks = []
    await Task.remove({ project: project._id })

    await Promise.all(
      tasks.map(async task => {
        const projectTask = new Task({
          ...task,
          project: project._id,
        })

        await projectTask.save()
        project.tasks.push(projectTask)
      })
    )

    await project.save()

    return response.status(200).json({
      project,
    })
  } catch (error) {}
})

router.delete('/:projectId', async function (request, response) {
  try {
    await Project.findByIdAndRemove(request.params.projectId)

    return response.status(204).json()
  } catch (error) {
    return response.status(400).json({ message: error.message })
  }
})

module.exports = router
