import './App.css'
import EditorInner from './components/Editor'

function App() {

  return (
    <div className='flex flex-col items-center w-full h-screen justify-center'>
        <div className='flex flex-col items-center justify-center h-full'>
          <EditorInner/>
        </div>
    </div>
  )
}

export default App
