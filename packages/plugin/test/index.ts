import EventEmitter from 'events'
import test from 'tape-promise/tape'
import { spy, stub } from 'sinon'

import plugin from '../src'

const files = [
  {
    path: 'foo',
    data: 'bar',
    map: null
  }
]

test('plugin: export', (t) => {
  t.equal(
    typeof plugin,
    'function',
    'must be a function'
  )

  t.end()
})

test('plugin: props', async (t) => {
  const name = 'testName'
  const pluginFn = stub().returns({ bar: true })
  const reporter = new EventEmitter()
  const beforeProps = { foo: true, reporter }
  const pluginRunner = await plugin(name, pluginFn)

  const result = await pluginRunner(beforeProps)

  t.ok(
    pluginFn.calledOnce,
    'plugin function should be called once'
  )

  const afterProps = pluginFn.firstCall.args[0]

  t.ok(
    afterProps.foo,
    'props should be passed through'
  )

  t.deepEqual(
    afterProps.reporter,
    reporter,
    '`reporter` should be passed through'
  )

  t.equal(
    typeof afterProps.logMessage,
    'function',
    '`logMessage` should be a function'
  )

  t.equal(
    typeof afterProps.logFile,
    'function',
    '`logFile` should be a function'
  )

  t.deepEqual(
    result,
    {
      foo: true,
      bar: true,
      reporter
    },
    'should extend result with returned props'
  )
})

test('plugin: no return', async (t) => {
  const name = 'testName'
  const pluginFn = stub().returns()
  const reporter = new EventEmitter()
  const beforeProps = { foo: true, reporter }
  const pluginRunner = await plugin(name, pluginFn)

  const result = await pluginRunner(beforeProps)

  t.deepEqual(
    result,
    beforeProps,
    'should return the same'
  )
})

test('plugin: done', async (t) => {
  const name = 'testName'
  const pluginFn = stub().returns(files)
  const eventStartSpy = spy()
  const eventDoneSpy = spy()
  const reporter = new EventEmitter()
  const props = { files, reporter }
  const pluginRunner = await plugin(name, pluginFn)

  reporter.on('start', eventStartSpy)
  reporter.on('done', eventDoneSpy)

  await pluginRunner(props)

  t.ok(
    eventStartSpy.calledOnceWith(name),
    'should emit `start` event'
  )

  t.ok(
    eventDoneSpy.calledOnceWith(name),
    'should emit `done` event'
  )
})

test('plugin: error', async (t) => {
  const name = 'testName'
  const testError = new Error('oops')
  const pluginFn = stub().throws(testError)
  const eventStartSpy = spy()
  const eventErrorSpy = spy()
  const reporter = new EventEmitter()
  const props = { files, reporter }
  const pluginRunner = await plugin(name, pluginFn)

  reporter.on('start', eventStartSpy)
  reporter.on('error', eventErrorSpy)

  try {
    await pluginRunner(props)
  } catch (error) {
    t.equal(
      error,
      null,
      'should swallow original error'
    )

    t.ok(
      eventStartSpy.calledOnceWith(name),
      'should emit `start` event'
    )

    t.ok(
      eventErrorSpy.calledOnceWith(name, testError),
      'should emit `error` event'
    )
  }
})

test('plugin: log message', async (t) => {
  const name = 'testName'
  const message = 'hello'
  const pluginFn = stub().callsFake(({ logMessage }) => {
    logMessage(message)

    return files
  })
  const eventMessageSpy = spy()
  const reporter = new EventEmitter()
  const props = { files, reporter }
  const pluginRunner = await plugin(name, pluginFn)

  reporter.on('message', eventMessageSpy)

  await pluginRunner(props)

  t.ok(
    eventMessageSpy.calledOnceWith(name, message),
    'should emit `message` event'
  )
})

test('plugin: log file', async (t) => {
  const name = 'testName'
  const filePath = 'file/path'
  const pluginFn = stub().callsFake(({ logFile }) => {
    logFile(filePath)

    return files
  })
  const eventFileSpy = spy()
  const reporter = new EventEmitter()
  const props = { files, reporter }
  const pluginRunner = await plugin(name, pluginFn)

  reporter.on('file', eventFileSpy)

  await pluginRunner(props)

  t.ok(
    eventFileSpy.calledOnceWith(name, filePath),
    'should emit `file` event'
  )
})
