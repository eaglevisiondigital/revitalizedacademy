(()=>{
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal?.authClient)return;
  const client=portal.authClient;

  let modal=null;
  let activeRecipe=null;
  let ingredients=[];
  let foods=[];
  let nutrients=[];

  const esc=(value)=>String(value??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");

  const numberOrNull=(value)=>{
    if(value===undefined||value===null||value==="")return null;
    const n=Number(value);
    return Number.isFinite(n)?n:null;
  };

  function ensureModal(){
    if(modal)return modal;
    modal=document.createElement("div");
    modal.className="recipe-builder-modal hidden";
    modal.setAttribute("aria-hidden","true");
    modal.innerHTML=
      '<div class="recipe-builder-backdrop" data-recipe-builder-close></div>'+
      '<section class="recipe-builder-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-builder-title">'+
        '<button class="recipe-builder-close" type="button" aria-label="Close recipe builder">×</button>'+
        '<p class="eyebrow">RECIPE INGREDIENT BUILDER</p>'+
        '<div class="recipe-builder-title-row">'+
          '<div><h2 id="recipe-builder-title">Build Recipe</h2><p id="recipe-builder-subtitle">Link ingredients to the Food Library and calculate the complete nutrient profile.</p></div>'+
          '<button id="recipe-builder-recalculate" class="primary-button compact" type="button">Recalculate Nutrition</button>'+
        '</div>'+
        '<section class="recipe-builder-overview">'+
          '<label><span>Recipe servings</span><div class="recipe-builder-inline"><input id="recipe-builder-servings" type="number" min="0.1" step="0.1"><button id="recipe-builder-save-servings" class="secondary-button compact" type="button">Save</button></div></label>'+
          '<div id="recipe-builder-calculation-state" class="recipe-builder-calculation-state"></div>'+
        '</section>'+
        '<div class="recipe-builder-layout">'+
          '<section class="recipe-builder-panel">'+
            '<div class="recipe-builder-panel-head"><div><strong>Ingredients</strong><span>Each linked food contributes its full nutrient profile.</span></div></div>'+
            '<div id="recipe-builder-ingredients" class="recipe-builder-ingredients"></div>'+
          '</section>'+
          '<section class="recipe-builder-panel recipe-builder-add">'+
            '<div class="recipe-builder-panel-head"><div><strong>Add Ingredient</strong><span>Use grams when possible for the most accurate calculation.</span></div></div>'+
            '<label><span>Food / ingredient</span><select id="recipe-builder-food"></select></label>'+
            '<div id="recipe-builder-food-hint" class="recipe-builder-food-hint"></div>'+
            '<div class="recipe-builder-grid">'+
              '<label><span>Quantity</span><input id="recipe-builder-quantity" type="number" min="0" step="0.01" placeholder="1"></label>'+
              '<label><span>Unit</span><input id="recipe-builder-unit" type="text" maxlength="40" placeholder="serving, cup, tbsp..."></label>'+
              '<label><span>Weight (grams)</span><input id="recipe-builder-weight" type="number" min="0" step="0.01" placeholder="Preferred"></label>'+
              '<label><span>Order</span><input id="recipe-builder-order" type="number" min="1" step="1"></label>'+
            '</div>'+
            '<label><span>Note</span><input id="recipe-builder-note" type="text" maxlength="240" placeholder="Optional preparation note"></label>'+
            '<button id="recipe-builder-add" class="primary-button" type="button">Add Ingredient</button>'+
          '</section>'+
        '</div>'+
        '<section class="recipe-builder-panel recipe-builder-nutrition">'+
          '<div class="recipe-builder-panel-head"><div><strong>Calculated Nutrition Per Serving</strong><span>Calculated from linked Food Library records. Blank source values remain unknown.</span></div></div>'+
          '<div id="recipe-builder-nutrition" class="recipe-builder-nutrition-grid"></div>'+
        '</section>'+
        '<p id="recipe-builder-status" class="form-status" aria-live="polite"></p>'+
      '</section>';
    document.body.append(modal);

    modal.querySelector("[data-recipe-builder-close]")?.addEventListener("click",close);
    modal.querySelector(".recipe-builder-close")?.addEventListener("click",close);
    modal.querySelector("#recipe-builder-food")?.addEventListener("change",renderFoodHint);
    modal.querySelector("#recipe-builder-add")?.addEventListener("click",addIngredient);
    modal.querySelector("#recipe-builder-recalculate")?.addEventListener("click",recalculate);
    modal.querySelector("#recipe-builder-save-servings")?.addEventListener("click",saveServings);
    return modal;
  }

  function status(message,type){
    const node=modal?.querySelector("#recipe-builder-status");
    if(node)portal.showStatus(node,message,type);
  }

  function close(){
    if(!modal)return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden","true");
    activeRecipe=null;
    ingredients=[];
  }

  async function load(){
    if(!activeRecipe)return;
    const [ingredientResult,foodResult,nutrientResult,recipeResult]=await Promise.all([
      client.from("recipe_ingredients")
        .select("id,recipe_id,ingredient,quantity,unit,note,sort_order,food_id,weight_grams,calculation_basis,nutrition_multiplier,nutrition_snapshot")
        .eq("recipe_id",activeRecipe.id)
        .order("sort_order"),
      client.from("food_catalog")
        .select("id,name,brand,category,active,image_url,nutrition,serving_size,serving_unit,grams_per_serving,data_source,source_record_id,source_verified")
        .eq("methodology_id",activeRecipe.methodology_id)
        .order("name"),
      client.from("nutrition_nutrient_catalog")
        .select("nutrient_key,name,category,unit,default_visible,sort_order")
        .eq("active",true)
        .order("sort_order"),
      client.from("recipes")
        .select("id,methodology_id,title,servings,nutrition,nutrition_calculated_at,nutrition_calculation_meta")
        .eq("id",activeRecipe.id)
        .single()
    ]);
    if(ingredientResult.error)throw ingredientResult.error;
    if(foodResult.error)throw foodResult.error;
    if(nutrientResult.error)throw nutrientResult.error;
    if(recipeResult.error)throw recipeResult.error;

    ingredients=ingredientResult.data||[];
    foods=foodResult.data||[];
    nutrients=nutrientResult.data||[];
    activeRecipe={...activeRecipe,...recipeResult.data};
  }

  function renderFoodOptions(){
    const select=modal.querySelector("#recipe-builder-food");
    select.replaceChildren();
    const placeholder=document.createElement("option");
    placeholder.value="";
    placeholder.textContent=foods.length?"Choose a food / ingredient":"No foods in this methodology yet";
    select.append(placeholder);
    foods.forEach((food)=>{
      const option=document.createElement("option");
      option.value=food.id;
      option.textContent=(food.brand?food.brand+" · ":"")+food.name+(food.active?"":" · Inactive");
      select.append(option);
    });
    modal.querySelector("#recipe-builder-order").value=String(ingredients.length+1);
    renderFoodHint();
  }

  function renderFoodHint(){
    const food=foods.find((row)=>row.id===modal?.querySelector("#recipe-builder-food")?.value);
    const hint=modal?.querySelector("#recipe-builder-food-hint");
    if(!hint)return;
    if(!food){
      hint.textContent="Choose a Food Library item to see its serving basis and nutrition source.";
      return;
    }
    const serving=[
      food.serving_size&&food.serving_unit?food.serving_size+" "+food.serving_unit:null,
      food.grams_per_serving?food.grams_per_serving+" g per serving":null
    ].filter(Boolean).join(" · ");
    const source=food.data_source||"ReVitalized custom";
    hint.textContent=(serving||"No serving conversion configured")+" · Source: "+source+(food.source_verified?" · Verified":"");
    if(food.serving_unit&&!modal.querySelector("#recipe-builder-unit").value){
      modal.querySelector("#recipe-builder-unit").value=food.serving_unit;
    }
  }

  function renderIngredients(){
    const root=modal.querySelector("#recipe-builder-ingredients");
    root.replaceChildren();
    if(!ingredients.length){
      const empty=document.createElement("div");
      empty.className="recipe-builder-empty";
      empty.textContent="No ingredients yet. Add foods from the Food Library to start calculating this recipe.";
      root.append(empty);
      return;
    }

    ingredients.forEach((row)=>{
      const food=foods.find((item)=>item.id===row.food_id);
      const card=document.createElement("article");
      card.className="recipe-builder-ingredient";
      const copy=document.createElement("div");
      copy.className="recipe-builder-ingredient-copy";
      if(food?.image_url){
        const image=document.createElement("img");
        image.src=food.image_url;
        image.alt=food.name||row.ingredient;
        image.loading="lazy";
        copy.append(image);
      }
      const text=document.createElement("div");
      const title=document.createElement("strong");
      title.textContent=row.ingredient;
      const meta=document.createElement("span");
      meta.textContent=[
        row.weight_grams?row.weight_grams+" g":null,
        row.quantity?row.quantity+" "+(row.unit||""):null,
        row.calculation_basis?String(row.calculation_basis).replaceAll("_"," "):"Not calculated",
        row.nutrition_multiplier?Number(row.nutrition_multiplier).toFixed(3)+" servings":null
      ].filter(Boolean).join(" · ");
      text.append(title,meta);
      if(row.note){
        const note=document.createElement("small");
        note.textContent=row.note;
        text.append(note);
      }
      copy.append(text);

      const actions=document.createElement("div");
      actions.className="recipe-builder-ingredient-actions";
      const remove=document.createElement("button");
      remove.type="button";
      remove.textContent="Remove";
      remove.addEventListener("click",()=>removeIngredient(row.id));
      actions.append(remove);
      card.append(copy,actions);
      root.append(card);
    });
  }

  function renderCalculation(){
    const state=modal.querySelector("#recipe-builder-calculation-state");
    const meta=activeRecipe?.nutrition_calculation_meta||{};
    const calculated=activeRecipe?.nutrition_calculated_at;
    if(!calculated){
      state.innerHTML='<strong>Not calculated yet</strong><span>Add ingredients, then calculate the recipe nutrient profile.</span>';
      state.className="recipe-builder-calculation-state";
      return;
    }
    const complete=Boolean(meta.complete);
    state.className="recipe-builder-calculation-state "+(complete?"complete":"incomplete");
    state.innerHTML='<strong>'+(complete?"Complete calculation":"Calculation needs attention")+'</strong>'+
      '<span>'+Number(meta.ingredients_used||0)+' ingredient(s) calculated · '+Number(meta.ingredients_incomplete||0)+' incomplete · '+new Date(calculated).toLocaleString()+'</span>';
  }

  function renderNutrition(){
    const root=modal.querySelector("#recipe-builder-nutrition");
    root.replaceChildren();
    const data=activeRecipe?.nutrition||{};
    const present=nutrients.filter((row)=>data[row.nutrient_key]!==undefined&&data[row.nutrient_key]!==null);
    if(!present.length){
      const empty=document.createElement("div");
      empty.className="recipe-builder-empty";
      empty.textContent="No calculated nutrients yet.";
      root.append(empty);
      return;
    }
    present.forEach((row)=>{
      const item=document.createElement("div");
      item.className="recipe-builder-nutrient";
      const name=document.createElement("span");name.textContent=row.name;
      const value=document.createElement("strong");
      const numeric=Number(data[row.nutrient_key]);
      value.textContent=(Number.isFinite(numeric)?numeric.toLocaleString(undefined,{maximumFractionDigits:4}):String(data[row.nutrient_key]))+" "+row.unit;
      item.append(name,value);
      root.append(item);
    });
  }

  function render(){
    ensureModal();
    modal.querySelector("#recipe-builder-title").textContent=activeRecipe?.title||"Build Recipe";
    modal.querySelector("#recipe-builder-servings").value=activeRecipe?.servings??"";
    renderFoodOptions();
    renderIngredients();
    renderCalculation();
    renderNutrition();
  }

  async function refresh(){
    try{
      await load();
      render();
      status("");
    }catch(error){
      status(error.message||String(error),"error");
    }
  }

  async function addIngredient(){
    if(!activeRecipe)return;
    const food=foods.find((row)=>row.id===modal.querySelector("#recipe-builder-food").value);
    if(!food){status("Choose a Food Library ingredient first.","error");return;}
    const quantity=numberOrNull(modal.querySelector("#recipe-builder-quantity").value);
    const unit=modal.querySelector("#recipe-builder-unit").value.trim()||null;
    const weight=numberOrNull(modal.querySelector("#recipe-builder-weight").value);
    const sortOrder=Math.max(1,Number(modal.querySelector("#recipe-builder-order").value||ingredients.length+1));
    const note=modal.querySelector("#recipe-builder-note").value.trim()||null;
    if((weight===null||weight<=0)&&(quantity===null||quantity<=0)){
      status("Enter either a weight in grams or a quantity.","error");
      return;
    }

    status("Adding ingredient...");
    const {error}=await client.from("recipe_ingredients").insert({
      recipe_id:activeRecipe.id,
      food_id:food.id,
      ingredient:food.name,
      quantity:quantity&&quantity>0?quantity:null,
      unit,
      weight_grams:weight&&weight>0?weight:null,
      note,
      sort_order:sortOrder
    });
    if(error){status(error.message,"error");return;}

    modal.querySelector("#recipe-builder-quantity").value="";
    modal.querySelector("#recipe-builder-weight").value="";
    modal.querySelector("#recipe-builder-note").value="";
    await recalculate(true);
  }

  async function removeIngredient(id){
    if(!activeRecipe)return;
    status("Removing ingredient...");
    const {error}=await client.from("recipe_ingredients").delete().eq("id",id).eq("recipe_id",activeRecipe.id);
    if(error){status(error.message,"error");return;}
    await recalculate(true);
  }

  async function saveServings(){
    if(!activeRecipe)return;
    const servings=numberOrNull(modal.querySelector("#recipe-builder-servings").value);
    if(servings===null||servings<=0){status("Enter a recipe serving count greater than zero.","error");return;}
    status("Saving servings...");
    const {error}=await client.from("recipes").update({servings,updated_at:new Date().toISOString()}).eq("id",activeRecipe.id);
    if(error){status(error.message,"error");return;}
    activeRecipe.servings=servings;
    await recalculate(true);
  }

  async function recalculate(quiet=false){
    if(!activeRecipe)return;
    if(!quiet)status("Calculating full recipe nutrition...");
    const {data,error}=await client.rpc("recalculate_recipe_nutrition",{p_recipe_id:activeRecipe.id});
    if(error){status(error.message,"error");return;}
    await refresh();
    const incomplete=Number(data?.ingredients_incomplete||0);
    status(
      incomplete
        ?"Nutrition calculated with "+incomplete+" ingredient(s) needing serving/weight information."
        :"Full nutrition calculated per serving.",
      incomplete?"error":"success"
    );
  }

  async function open(recipe){
    if(!recipe?.id)return;
    activeRecipe=recipe;
    ensureModal();
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden","false");
    modal.querySelector("#recipe-builder-title").textContent=recipe.title||"Build Recipe";
    modal.querySelector("#recipe-builder-ingredients").innerHTML='<div class="recipe-builder-empty">Loading recipe ingredients...</div>';
    status("");
    await refresh();
  }

  window.RA_RECIPE_BUILDER={open,close,refresh};
})();