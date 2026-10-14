/* PDF-inspired editorial enhancements for a fictional static preview only.
   No network, storage, account access or actual health data. */
(function(){
"use strict";
var doc=document,NS="http://www.w3.org/2000/svg";
var paths=[
"M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13z",
"M12 3v18M3 12h18M5 5l14 14M19 5L5 19",
"M12 3v3m0 12v3m9-9h-3M6 12H3m13-4-3 3-3-3",
"M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8.5 10v.2M15.5 10v.2M8 14q4 4 8 0",
"M4 9v6m3-9v12m10-12v12m3-9v6M7 12h10",
"M21 15.5A9 9 0 0 1 8.5 3a9 9 0 1 0 12.5 12.5z",
"M10 3v4c0 3-5 3-5 9a5 5 0 0 0 5 5c3 0 5-3 5-6 0-4 4-5 4-9V3",
"M12 3c-3 0-6 2-6 6 0 3 2 5 6 12 4-7 6-9 6-12 0-4-3-6-6-6z",
"M12 3c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zM9 12h6M12 9v6",
"M4 12a8 8 0 0 1 14-5m1-4v5h-5M20 12a8 8 0 0 1-14 5m-1 4v-5h5",
"M12 3c-5 0-8 4-8 9s3 9 8 9 8-4 8-9-3-9-8-9zM9 10h6m-6 4h6",
"M3 7h18v12H3zM3 10h18M7 15h4"
];
function node(tag,cls,txt){var e=doc.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function icon(i){var wrapper=node("span","rva-mini-icon"),svg=doc.createElementNS(NS,"svg"),p=doc.createElementNS(NS,"path");svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("aria-hidden","true");p.setAttribute("d",paths[i]||paths[0]);svg.append(p);wrapper.append(svg);return wrapper}
var drivers=Array.from(doc.querySelectorAll("#driver-list .driver"));
if(drivers.length!==12)return;
function data(i){var d=drivers[i];return {name:d.querySelector(".driver-name strong").textContent,score:Number.parseInt(d.querySelector(".value").textContent,10),tone:d.dataset.status,driver:d}}
function openDriver(i){doc.getElementById("tab-drivers").click();var d=drivers[i];d.open=true;window.requestAnimationFrame(function(){d.scrollIntoView({block:"center",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});d.querySelector("summary").focus({preventScroll:true})})}
drivers.forEach(function(d,i){var idx=d.querySelector(".index"),emblem=node("span","rva-driver-emblem");emblem.append(icon(i));idx.insertAdjacentElement("afterend",emblem)});
/* Numbered, icon-led editorial priority cards. */
Array.from(doc.querySelectorAll(".priority")).forEach(function(card,i){
 var num=card.querySelector(".num");if(!num)return;
 var top=node("div","rva-priority-top"),iconSlot=icon([6,5,0][i]||0);
 top.append(num,iconSlot);card.prepend(top);
});
var snapshot=doc.getElementById("roadmap-featured-rings");
[0,3,4,5,6,9,10,11].forEach(function(i){var d=data(i),button=node("button","rva-snapshot-item"),dial=node("span","rva-dial"),mid=node("span","rva-dial-center"),tone=d.tone==="red"?"#a65747":d.tone==="yellow"?"#c79e49":"#23724c";button.type="button";button.setAttribute("aria-label","Explore "+d.name+", illustrative "+d.score+" out of 100");dial.style.setProperty("--dial-value",String(d.score));dial.style.setProperty("--dial-color",tone);mid.append(icon(i),node("strong","",String(d.score)),node("small","","out of 100"));dial.append(mid);button.append(dial,node("b","",d.name),node("small","",d.tone==="green"?"Example strength":d.tone==="red"?"Priority":"Needs attention"));button.addEventListener("click",function(){openDriver(i)});snapshot.append(button)});
var insights=[
{idx:3,title:"Nutrition habits",detail:"Build on consistent, nourishing food choices."},
{idx:4,title:"Physical activity",detail:"Use regular movement as an established strength."},
{idx:5,title:"Rest & recovery",detail:"Notice where restoration can fit into the day."},
{idx:9,title:"Daily routines",detail:"Repeat the small habits that fit real life."}
];
var insightContainer=doc.getElementById("roadmap-insight-cards");
insights.forEach(function(item){var d=data(item.idx),button=node("button","rva-insight-item"),emblem=node("span","rva-insight-icon"),description=node("span","rva-insight-info"),bar=node("span","rva-insight-bar"),fill=node("i"),score=node("span","rva-insight-value",String(d.score)),small=node("small","","/100");button.type="button";button.dataset.tone=d.tone==="yellow"||d.tone==="red"?"attention":"strength";emblem.append(icon(item.idx));description.append(node("strong","",item.title),node("span","",item.detail));fill.style.width=d.score+"%";bar.append(fill);score.append(small);button.append(emblem,description,bar,score);button.setAttribute("aria-label",item.title+": sample "+d.score+" out of 100. Explore "+d.name);button.addEventListener("click",function(){openDriver(item.idx)});insightContainer.append(button)});
var taskList=doc.getElementById("plan-list");
function numberTasks(){Array.from(taskList.children).filter(function(child){return child.classList.contains("task")}).forEach(function(child,i){if(!child.querySelector(".rva-task-medallion"))child.prepend(node("span","rva-task-medallion",String(i+1)))})}
var observer=new MutationObserver(function(){numberTasks()});observer.observe(taskList,{childList:true});numberTasks();
/* Deliberately temporary demo-only reflections and consultation questions.
   Production versions must use authenticated person-scoped storage, NEVER this public sample page. */
var planLeft=doc.querySelector(".plan-layout>div:first-child");
if(planLeft){var reflection=node("article","plan-box rva-reflections"),head=node("h3","","Your Reflections"),label=node("label","","What feels manageable? What did you notice?"),text=node("textarea"),hint=node("small","","Preview-only: this text is not saved or sent anywhere.");text.id="roadmap-reflections";label.htmlFor=text.id;text.placeholder="What feels manageable? What might get in the way? What did you notice?";reflection.append(head,label,text,hint);planLeft.append(reflection)}
var sidebar=doc.querySelector(".plan-layout aside");
if(sidebar){var pane=node("article","plan-box"),h=node("h3","","Optional Paid Roadmap Consultation"),p=node("p","","A personal coach review and explanation is a separate $250 consultation. Eligible affiliate offers can reduce the price by $50. Scheduling and payment are not connected in this concept."),trigger=node("button","btn gold","Preview Consultation Questions →");trigger.type="button";pane.append(h,p,trigger);sidebar.append(pane);
var dialog=node("dialog","rva-question-dialog"),eyebrow=node("div","eyebrow","Personal Roadmap Consultation"),title=node("h2","","What would you like to understand?"),desc=node("p","","This is a fictional consultation-preparation preview, not a reservation or purchase. Booking opens only after payments and calendar integrations are ready."),questionLabel=node("label","","Questions for a coach"),questions=node("textarea"),actions=node("div","rva-modal-actions"),cancel=node("button","btn secondary","Close"),save=node("button","btn gold","Keep Questions for This Visit"),notice=node("p","rva-modal-note","No questions are submitted and no consultation or payment is booked.");title.id="rva-question-title";dialog.setAttribute("aria-labelledby",title.id);questionLabel.setAttribute("for","rva-question-input");questions.id="rva-question-input";questions.placeholder="For example: Which starting action should I discuss first?";cancel.type="button";save.type="button";actions.append(cancel,save);dialog.append(eyebrow,title,desc,questionLabel,questions,actions,notice);doc.body.append(dialog);trigger.addEventListener("click",function(){dialog.showModal();questions.focus()});cancel.addEventListener("click",function(){dialog.close()});save.addEventListener("click",function(){dialog.close();trigger.textContent="Review Consultation Questions →"});dialog.addEventListener("click",function(e){if(e.target===dialog)dialog.close()});
var reset=doc.getElementById("reset");reset.addEventListener("click",function(){questions.value="";var reflections=doc.getElementById("roadmap-reflections");if(reflections)reflections.value="";trigger.textContent="Preview Consultation Questions →"})}
})();
