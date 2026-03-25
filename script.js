function openTool(tool){
document.getElementById("modal").style.display="flex";
let html="";

if(tool==="calc"){
html=`<input id="calc"><button onclick="calcResult()">=</button>`;
}

if(tool==="todo"){
html=`<input id="todoInput">
<button onclick="addTodo()">Add</button>
<ul id="list"></ul>`;
}

if(tool==="text"){
html=`<textarea id="textArea"></textarea>
<button onclick="upper()">UPPER</button>`;
}

if(tool==="note"){
html=`<textarea id="note" oninput="saveNote()"></textarea>`;
}

document.getElementById("modalContent").innerHTML=html;
}

document.getElementById("modal").onclick=function(e){
if(e.target.id==="modal") this.style.display="none";
};

function calcResult(){ calc.value=eval(calc.value); }
function addTodo(){
let li=document.createElement("li");
li.innerText=todoInput.value;
list.appendChild(li);
}
function upper(){ textArea.value=textArea.value.toUpperCase(); }
function saveNote(){ localStorage.setItem("note",note.value); }
