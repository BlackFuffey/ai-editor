const display = document.getElementById('display');
const SUBSTATE_INACTIVE = "inactive";
const SUBSTATE_PROCESS = "process";
const SUBSTATE_ACTIVE = "active";

var currentDoc;

const evaluate = async () => {

  setSubmitState("process");
  resetUI();

  let response; 
  try{
    response = await (await fetch("/api/evaluate", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mode: getMode(), body: document.getElementById('input').value })
    })).json();
  } catch (error) {
    setError(`Request failed: ${error}`);
    return;
  } finally { setSubmitState("inactive"); }

  if (response.status !== "ok") {
    setError(response.message);
    return;
  }

  currentDoc = response.body;

  updateDisplay();
  setEvaluationVisible();
  flipBody(false);
  
};

const finishReview = async () => {
  document.getElementById("input").value = exportDisplay();
  setDetails(null);
}

function setError(err, visible=true){
  const error = document.getElementById("error");
  error.innerText = err;
  if (visible) error.style.display = "inline";
  else error.style.display = "none";
}

function flipBody(side){
  const input = document.getElementById("input");
  const display = document.getElementById("display");
  if (side){
    input.className = input.className.replace("hidden ", "");
    display.className = "hidden " + display.className;
  } else {
    display.className = display.className.replace("hidden ", "");
    input.className = "hidden " + display.className;
  }
}

function setSubmitState(state){
  const submit = document.getElementById('submit');
  switch(state){
    case "inactive":
      submit.className = "inactive";
      submit.innerText = "Evaluate";
      submit.disabled = false;
      submit.onclick = evaluate;
      break;
    case "process":
      submit.className = "processing";
      submit.innerText = "Processing";
      submit.disabled = true;
      break;
    case "active":
      submit.className = "activated";
      submit.innerText = "Accept";
      submit.disabled = false;
      submit.onclick = finishReview;
      break;
    default:
      throw new Error(`Invalid button state ${state}`);
  }
}

function resetUI(){
  flipBody(true);
  setError("", false);
  setEvaluationVisible(false);
}

function setEvaluationVisible(visible){
  const evaluationBlock = document.getElementById("evaluation");

  if (visible) evaluationBlock.className = "hidden " + evaluationBlock.className;
  else evaluationBlock.className = evaluationBlock.className.replace("hidden ", "");

}

function setDisplay(){

}

function exportDisplay(){

}
