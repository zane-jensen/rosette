import './App.css'
import Editor from './components/Editor/Editor'
import { createListItemNode, createOrderedListNode, createTextNode, createUnorderedListNode } from './nodes/factories';
import { testRicosConversion } from './nodes/ricos';

declare global {
  interface Window {
    testRicosConversion: typeof testRicosConversion;
  }
}

function App() {

  const defaultValue = [
      createTextNode("Ordered List"),
      {
          ...createOrderedListNode(),
          nodes: [
              createListItemNode("Hey"),
              createListItemNode("Ashley!"),
              createListItemNode("This works!")
          ]
      },
      createTextNode("Unordered List"),
      {
          ...createUnorderedListNode(),
          nodes: [
              createListItemNode("The raw rich content"),
              createListItemNode("is down"),
              createListItemNode("below!"),
              createListItemNode("Click on me and click [UL] or [OL]")
          ]
      },
      createTextNode(""),
      createTextNode("Try to select me then click [OL]"),
      createTextNode(""),
      createTextNode("Try to select me then click [UL]"),
      createTextNode(""),
      createTextNode("Delete button only works for text not nested in a list so far!"),
      createTextNode(""),
      createTextNode("It's not very user friendly yet! But once we get more inline controls it'll start feeling good!")
  ]

  if (typeof window !== "undefined") {
    window.testRicosConversion = testRicosConversion;
  }

  return (
    <div className='flex flex-col items-center w-full h-screen justify-center'>
        <div className='flex flex-col items-center justify-center h-full max-w-150'>
          <Editor defaultValue={testRicosConversion()} className='w-200'/>
        </div>
    </div>
  )
}

export default App
