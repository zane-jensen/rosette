import './App.css'
import Editor from './pages/Editor'

function App() {

  return (
    <div className='flex flex-col items-center w-full h-screen justify-center'>
        <div className='flex flex-col items-center justify-center h-full'>
          <Editor/>
        </div>
    </div>
  )
}

export default App
