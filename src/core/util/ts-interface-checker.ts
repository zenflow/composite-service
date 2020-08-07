import { IErrorDetail } from 'ts-interface-checker/dist/util'

export function getErrorMessage(error: IErrorDetail): string {
  return getErrorMessageLines(error).join('\n')
}

function getErrorMessageLines(error: IErrorDetail): string[] {
  let result = [`\`${error.path}\` ${error.message}`]
  if (error.nested) {
    for (const nested of error.nested) {
      result = result.concat(getErrorMessageLines(nested).map(s => `    ${s}`))
    }
  }
  return result
}
