import * as core from '@actions/core'
import * as github from '@actions/github'
import mustache from 'mustache'

// What this action does:
// 1. check the file changes in the PR
// 2. check if the file is in the list of files to be formatted
// 3. check if the file is formatted
// 4. if yes, do nothing
// 5. if not, comment on the PR with the list of files that need to be formatted
// 6. add instructions in PR body on how to respond to the comment in order to format the files
// 7. add a label to the PR to indicate that the PR is not formatted
// 8. add a checkbox to the body and if checked, format the files and remove the label

async function run(): Promise<void> {
  try {
    core.info(`🤖 Checking format issues...`)
    const token = core.getInput('github_token')
    // const trigger = core.getInput('trigger')

    if (!token)
      return core.setFailed(`🚫 Missing required input: token = ${token}`)

    const client = github.getOctokit(token)

    const {data: pullRequest} = await client.rest.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.payload.pull_request?.number || 0,
      headers: {
        accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    core.info(`🤖 Pull request: ${JSON.stringify(pullRequest, null, 2)}`)

    const {data: files} = await client.rest.pulls.listFiles({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.payload.pull_request?.number || 0,
      headers: {
        accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    core.info(`🤖 Files: ${JSON.stringify(files, null, 2)}`)

    // files 'js,jsx,ts,tsx,css,scss,md'
    const filesInput = core.getInput('files')
    const filesToFormat = files.filter(file => {
      return file.filename.match(filesInput)
    })

    core.info(`🤖 Files to format: ${JSON.stringify(filesToFormat, null, 2)}`)

    if (filesToFormat.length === 0) {
      return core.info(`🤖 No files to format`)
    }

    const {data: comments} = await client.rest.issues.listComments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.payload.pull_request?.number || 0,
      headers: {
        accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    core.info(`🤖 Comments: ${JSON.stringify(comments, null, 2)}`)

    const comment = comments.find(c => {
      return c.user?.login === 'github-actions[bot]'
    })

    core.info(`🤖 Comment: ${JSON.stringify(comment, null, 2)}`)

    if (comment) {
      await client.rest.issues.deleteComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        comment_id: comment.id,
        headers: {
          accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    }

    const filesToFormatString = filesToFormat.map(file => {
      return file.filename
    })

    core.info(
      `🤖 Files to format string: ${JSON.stringify(
        filesToFormatString,
        null,
        2
      )}`
    )

    const body = mustache.render(core.getInput('pr_body'), {
      files: filesToFormatString.join('\n'),
      formattedFiles: filesToFormatString.join('\n')
    })

    // # we gonna use Mustache template to render this: {{ ... }}
    // default: |
    //   ## :warning: Prettier Format Suggestion :warning:

    //   This PR is a suggestion to format your code using [Prettier](https://prettier.io/).
    //   There are some files that are not formatted correctly, so I suggest you to use Prettier to format them.

    //   Currently, the following files are not formatted correctly:

    //   {{#files}}
    //   - {{.}}
    //   {{/files}}

    //   If you want to format them, check the box below and a commit will be added to this PR with the formatted files.

    //   - [ ] I want to format the files

    //   <details>
    //   <summary>Click here to see the formatted files</summary>

    //   {{#formattedFiles}}
    //   - {{.}}
    //   {{/formattedFiles}}

    //   </details>
    // the comment above is how it looks like in the PR.
    // replace the {{#files}} with the list of files that need to be formatted
    // replace the {{#formattedFiles}} with the list of files that are formatted

    await client.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.payload.pull_request?.number || 0,
      body,
      headers: {
        accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const labels = pullRequest.labels.map(label => {
      return label.name
    })

    if (!labels.includes('needs-formatting')) {
      await client.rest.issues.addLabels({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: github.context.payload.pull_request?.number || 0,
        labels: ['needs-formatting'],
        headers: {
          accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    }

    //     const body = pullRequest.body

    //     if (!body?.includes('formatting')) {
    //       const newBody = `${body}

    // ## Formatting

    // - [ ] I have run \`npm run format\` on my branch and have formatted all files that needed to be formatted.
    // `

    //       await client.rest.pulls.update({
    //         owner: github.context.repo.owner,
    //         repo: github.context.repo.repo,
    //         pull_number: github.context.payload.pull_request?.number || 0,
    //         body: newBody,
    //         headers: {
    //           accept: 'application/vnd.github.v3+json',
    //           'X-GitHub-Api-Version': '2022-11-28'
    //         }
    //       })
    //     }

    // const {data: checkRuns} = await client.rest.checks.listForRef({
    //   owner: github.context.repo.owner,
    //   repo: github.context.repo.repo,
    //   ref: github.context.sha,
    //   headers: {
    //     accept: 'application/vnd.github.v3+json',
    //     'X-GitHub-Api-Version': '2022-11-28'
    //   }
    // })

    // core.info(`🤖 Check runs: ${JSON.stringify(checkRuns, null, 2)}`)
    // const checkRun = checkRuns.check_runs.find(r => {
    //   return r.name === 'Prettier'
    // })

    // core.info(`🤖 Check run: ${JSON.stringify(checkRun, null, 2)}`)
    // if (checkRun) {
    //   await client.rest.checks.update({
    //     owner: github.context.repo.owner,
    //     repo: github.context.repo.repo,
    //     check_run_id: checkRun.id,
    //     status: 'completed',
    //     conclusion: 'neutral',
    //     output: {
    //       title: 'Prettier',
    //       summary: 'Some files need to be formatted',
    //       text: 'Some files need to be formatted'
    //     },
    //     headers: {
    //       accept: 'application/vnd.github.v3+json',
    //       'X-GitHub-Api-Version': '2022-11-28'
    //     }
    //   })
    // }

    core.info(`🤖 Done`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
