const stripByteOrderMark = (text: string) => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text)

export const readTextFile = async (file: File): Promise<string> => stripByteOrderMark(await file.text())

export const downloadTextFile = (fileName: string, contents: string) => {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
