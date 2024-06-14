var currentDoc;

//fetch mode list
(async function(){
  let response; 

  try{
    response = await fetch("/api/modelist");
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    response = await response.json();
  } catch (error) {
    alert(`Failed to fetch modes, retrying\n ${error}`);
    location.reload();
  }
  
  const modeselector = document.getElementById("mode");
  response.forEach(mode => {
    let modeOption = document.createElement("option");
    modeOption.value = mode.key;
    modeOption.text = mode.name;
    modeselector.add(modeOption);
  })

})();


const evaluate = async () => {

  console.log("Evaluating");

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
    console.log(error);
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

function getMode(){
  return document.getElementById("mode").value;
}

function setElementVisibility(element, visible){
  if (visible) element.className = element.className.replace("hidden ", "");
  else element.className = "hidden " + element.className;
}
   


const finishReview = async () => {
  document.getElementById("input").value = exportDisplay();
  setDetails(-1);
}

function setError(err, visible=true){
  const error = document.getElementById("error");
  error.innerText = err;
  setElementVisibility(error, visible);
}

function flipBody(side){
  setElementVisibility(document.getElementById("input"), side);
  setElementVisibility(document.getElementById("display"), !side);
}

function setSubmitState(state){
  const submit = document.getElementById('submit');
  switch(state){
    case "inactive":
      submit.className = "inactive";
      submit.innerText = "Evaluate";
      submit.disabled = false;
      submit.addEventListener("click", evaluate);
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
      submit.addEventListener("click", SubmitEvent);
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

function setDetails(i){
  const detailContainer = document.getElementById("details");

  if (i === -1){
    detailContainer.innerHTML = "";
    return;
  }
  
}

function setEvaluationVisible(visible){ setElementVisibility(document.getElementById("evaluation"), visible); }

function updateDisplay(){
  if (!currentDoc) throw new Error("Attempting to update display to non existance document");
  
  let spanId = [];
  document.getElementById("display").innerText = currentDoc.body.replace(/\[.*?\]\{.*?\}/g, (match) => {
    // Extract the text within the brackets and braces
    const regex = /\[(.*?)\]\{(.*?)\}/;
    const matches = regex.exec(match);

    if (matches) {
      const bracketText = matches[1];
      const braceText = matches[2];
      
      const spanId = `span-${braceText}`;
      
      (async () => {
        if (spanList.includes(spanId)) return;

        spanList.push(spanId);
        let spanElm;
        

        for (let i = 0; !spanElm; i++){
          if (i > 50) throw new Error(`Timeout waiting for ${spanId}`);
          
          spanElm = document.getElementById(spanId);

          await new Promise(resolve => settimeout(resolve, 500));
        }
        
        spanElm.addEventListener("click", () => { setDetails(braceText) });

      })()

      return `<span id=${spanId} class="${currentDoc[braceText].type}">${bracketText}:${braceText}</span>`;
    }

    return match;
  });

  
}

function exportDisplay(){ return document.getElementById("display").innerText; }

resetUI();
setSubmitState("inactive");

console.log("Finished loading JavaScript");
