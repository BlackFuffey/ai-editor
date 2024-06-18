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

  renderDoc();
  setEvaluationVisible(true);
  flipBody(false);
  setSubmitState("active");
};

function getMode(){
  return document.getElementById("mode").value;
}

function setElementVisibility(element, visible){
  if (visible) element.className = element.className.replace(/hidden /g, "");
  else element.className = "hidden " + element.className;
}
   


const finishReview = async () => {
  document.getElementById("input").value = exportDisplay();
  setSubmitState("inactive");
  resetUI();
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
      submit.removeEventListener("click", finishReview);
      submit.addEventListener("click", evaluate);
      break;
    case "process":
      submit.className = "processing";
      submit.innerHTML = '<img src="/spinner.png" class="spinner" />';
      submit.disabled = true;
      break;
    case "active":
      submit.className = "activated";
      submit.innerText = "Finish";
      submit.disabled = false;
      submit.removeEventListener("click", evaluate);
      submit.addEventListener("click", finishReview);
      break;
    default:
      throw new Error(`Invalid button state ${state}`);
  }
}

function resetUI(){
  flipBody(true);
  setError("", false);
  setEvaluationVisible(false);
  setDetails();
}

function setDetails(highlight){
  const detailContainer = document.getElementById("details");

  if (!highlight){
    detailContainer.innerHTML = "";
    return;
  }

  console.log(highlight);

  const i = +highlight.id.replace('span-', '');
  const original = highlight.innerText;
  
  let type = "missingno";
  switch(currentDoc[i].type){
    case "grammar": type = "Grammar"; break;
    case "typo": type = "Typo"; break;
  }

  const acceptId = `detail-${i}`;
  
  if (currentDoc[i].replace){

    if (original.split(" ").length > 50) detailContainer.innerHTML = `
      <small>${type}</small>
      <h2>${original}</h2>
      <h3>↓</h3>
      <h2>${currentDoc[i].replace}</h2>
      <br>
      <h3>Reason</h3>
      <p>${currentDoc[i].reason}</p>
      <button id=${acceptId} class="detail-accept">Accept</button>`

    else detailContainer.innerHTML = `
      <small>${type}</small>
      <h2>${original} → ${currentDoc[i].replace}</h2>
      <br>
      <h3>Reason</h3>
      <p>${currentDoc[i].reason}</p>
      <button id=${acceptId} class="detail-accept">Accept</button>`
    
    predictElement(acceptId, (e) => {
        e.addEventListener('click', () => {
            highlight.className = '';
            highlight.innerText = currentDoc[i].replace;
            highlight.outerHTML = highlight.outerHTML;
        });
    });
  } else detailContainer.innerHTML = `
          <small>${type}</small>
          <h3>Comment</h3>
          <p>${currentDoc[i].reason}</p>`

}

function setEvaluationVisible(visible){ setElementVisibility(document.getElementById("evaluation"), visible); }

function renderDoc(){
  if (!currentDoc) throw new Error("Attempted to render non existance doc");
  
  console.log(currentDoc);

  document.getElementById("feedback").innerText = currentDoc.feedback;

  document.getElementById("rating").innerText = currentDoc.rating;

  let spanList = [];

  document.getElementById("display").innerHTML = '';

  document.getElementById("display").innerHTML = currentDoc.body.replace(/\[.*?\]\{.*?\}/g, (match) => {
    // Extract the text within the brackets and braces
    const regex = /\[(.*?)\]\{(.*?)\}/;
    const matches = regex.exec(match);

    if (matches) {
      const bracketText = matches[1];
      const braceText = matches[2];
      
      const spanId = `span-${braceText}`;
      if (!spanList.includes(spanId)) {
        spanList.push(spanId);
        predictElement(spanId, element => element.addEventListener("click", () => { setDetails(element) }));
      };

      return `<span id=${spanId} class="${currentDoc[braceText].type}">${bracketText}</span>`;
    }

    return match;
  }).replace("\n", "<br>");

  
}

async function predictElement(id, action){
  let element;

  for (let i = 0; !element; i++){
    if (i > 50) throw new Error(`Timeout waiting for ${id} to materialize`);

    element = document.getElementById(id);

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  action(element);
}

function exportDisplay(){ return document.getElementById("display").innerText; }

resetUI();
setSubmitState("inactive");

console.log("Finished loading JavaScript");
