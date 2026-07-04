import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

interface Identity { participant:{id:string;role:string}; recoveryToken:string; sessionId:string }

async function post(api:APIRequestContext,url:string,options:Parameters<APIRequestContext["post"]>[1]) {
  for(let attempt=0;attempt<3;attempt+=1){try{return await api.post(url,options);}catch(error){if(attempt===2)throw error;await new Promise((resolve)=>setTimeout(resolve,150*(attempt+1)));}}
  throw new Error("unreachable");
}
async function create(api:APIRequestContext,definitionId:string){const response=await post(api,"/api/sessions",{data:{definitionId,name:`Phase 8.6.1 ${Date.now()}`,language:"fr"}});expect(response.ok).toBeTruthy();return response.json() as Promise<{session:{id:string};invites:Record<string,{token:string}>}>;}
async function join(api:APIRequestContext,token:string,name:string){const response=await post(api,"/api/join",{data:{inviteToken:token,displayName:name}});expect(response.ok).toBeTruthy();const identity=await response.json() as Identity;expect(identity.participant?.id).toBeTruthy();return identity;}
function headers(identity:Identity){return {"x-participant-id":identity.participant.id,"x-recovery-token":identity.recoveryToken};}
async function command(api:APIRequestContext,identity:Identity,data:Record<string,unknown>){const response=await post(api,`/api/sessions/${identity.sessionId}/commands`,{headers:headers(identity),data});const text=await response.text();expect(response.ok,text).toBeTruthy();return JSON.parse(text);}
async function open(page:Page,sessionId:string,identity:Identity){await page.addInitScript(({id,actor})=>localStorage.setItem(`raidweave:${id}`,JSON.stringify({participantId:actor.participant.id,recoveryToken:actor.recoveryToken})),{id:sessionId,actor:identity});await page.goto(`/session/${sessionId}`);}
async function noOverflow(page:Page){const size=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth+1);}

async function live(api:APIRequestContext,definitionId="gouffre-gigalodon"){
  const created=await create(api,definitionId);
  const captain=await join(api,created.invites.CAPTAIN!.token,"Captain");
  const editor=await join(api,created.invites.EDITOR!.token,"Editor");
  const players:Identity[]=[];
  for(let index=0;index<6;index+=1)players.push(await join(api,created.invites.PARTICIPANT!.token,`P${index}`));
  for(const identity of [captain,editor,...players])await command(api,captain,{type:"SET_READY",participantId:identity.participant.id,ready:true});
  await command(api,captain,{type:"START_SESSION"});
  return {sessionId:created.session.id,captain,editor,players};
}

async function final(api:APIRequestContext,result:"VICTORY"|"DEFEAT"){
  const seeded=await live(api);
  const holder=seeded.players[0]!;
  await command(api,seeded.captain,{type:"ADJUST_GIGALODON_SALT",delta:30,cause:"Collecte pilote",responsibleParticipantId:seeded.players[1]!.participant.id});
  await command(api,seeded.captain,{type:"SET_GIGALODON_LIGHT",floor:-1,level:2,intervalSeconds:120,intervalSourceStatus:"GUIDE_CONFIRMED",saltCostSourceStatus:"GUIDE_CONFIRMED"});
  await command(api,seeded.captain,{type:"UPDATE_GIGALODON_INVENTORY",participantId:holder.participant.id,resources:{quartz:5,uniteMureine:1,rancuneExecrabe:1,noirceurWillorque:1},currentFloor:0,risk:"HIGH"});
  await command(api,seeded.captain,{type:"DEPOSIT_GIGALODON_INVENTORY",participantId:holder.participant.id});
  await command(api,seeded.captain,{type:"CONFIRM_GIGALODON_FINAL_READINESS",activeFights:1,activeFightsRuleSourceStatus:"LIVE_REQUIRED",finalTeamReady:true,captainConfirmed:true});
  await command(api,seeded.captain,{type:"START_GIGALODON_FINAL",preparationSeconds:180});
  await command(api,holder,{type:"UPDATE_GIGALODON_FINAL",combatRound:result==="VICTORY"?3:2,totalDamage:result==="VICTORY"?300000:70000,completed:true,result});
  return seeded;
}

test("Captain: shared salt, guide baseline, soft warning and VICTORY",async({page,request},testInfo)=>{
  test.skip(testInfo.project.name!=="desktop-1440");
  const seeded=await final(request,"VICTORY");
  await open(page,seeded.sessionId,seeded.captain);
  await expect(page.getByTestId("shared-salt-pool")).toContainText("30");
  await expect(page.getByTestId("floor-light-panel")).toContainText("Guide confirmé");
  await expect(page.getByTestId("gigalodon-soft-warnings")).toContainText("le capitaine peut continuer");
  await expect(page.getByTestId("gigalodon-final-tracker")).toContainText("Résultat · VICTORY");
  await noOverflow(page);
});

test("Captain: DEFEAT remains a closable explicit outcome",async({page,request},testInfo)=>{
  test.skip(testInfo.project.name!=="desktop-1440");
  const seeded=await final(request,"DEFEAT");
  await open(page,seeded.sessionId,seeded.captain);
  await expect(page.getByTestId("gigalodon-final-tracker")).toContainText("Résultat · DEFEAT");
  await expect(page.getByRole("button",{name:"Clôturer le raid"})).toBeEnabled();
  await expect(page.getByRole("button",{name:"Démarrer Gigalodon"})).toHaveCount(0);
  await noOverflow(page);
});

test("Participant mobile: no personal salt and Information incorrecte",async({page,request},testInfo)=>{
  test.skip(testInfo.project.name!=="mobile-390");
  const seeded=await live(request);
  await command(request,seeded.captain,{type:"ADJUST_GIGALODON_SALT",delta:9,cause:"Collecte mobile",responsibleParticipantId:seeded.players[0]!.participant.id});
  await open(page,seeded.sessionId,seeded.players[0]!);
  await expect(page.getByTestId("participant-shared-salt")).toContainText("9");
  await expect(page.locator('.inventory-inputs label',{hasText:/^salt$/i})).toHaveCount(0);
  await page.getByTestId("information-correction").locator("summary").click();
  await page.getByLabel("Règle ou affichage concerné").fill("Lumière étage −1");
  await page.getByLabel("Note sur l’information incorrecte").fill("Le client affiche une autre valeur");
  await page.getByRole("button",{name:"Envoyer le signalement"}).click();
  await expect(page.getByText("Le client affiche une autre valeur")).toBeVisible();
  await noOverflow(page);
});

test("Sanctuaire: corridor guide baseline is 60",async({page,request},testInfo)=>{
  test.skip(testInfo.project.name!=="desktop-1440");
  const seeded=await live(request,"sanctuaire-jardins-eternels");
  await open(page,seeded.sessionId,seeded.captain);
  await expect(page.getByTestId("corridor-dispatcher")).toContainText("0 / 60");
  await expect(page.getByTestId("corridor-dispatcher")).toContainText("Guide confirmé · pas encore testé en live");
  await noOverflow(page);
});
