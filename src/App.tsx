import './App.css'
import Editor from './components/Editor/Editor'
import { convertFromRicosDocument } from './nodes/ricos'
import { TEST_RICOS_CONTENT } from './tests/ricos-sample'

function App() {

  const defaultValue = convertFromRicosDocument(TEST_RICOS_CONTENT)

  return (
    <div className='flex flex-col items-center w-full h-screen justify-center'>
        <div className='flex flex-col items-center justify-center h-full max-w-150'>
          <Editor defaultValue={defaultValue} className='w-200'/>
        </div>
    </div>
  )
}

export default App
