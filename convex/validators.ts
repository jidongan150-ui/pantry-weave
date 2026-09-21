import { v } from "convex/values";
export const category=v.union(v.literal("蔬菜水果"),v.literal("肉蛋奶"),v.literal("主食干货"),v.literal("调味品"),v.literal("其他"));
export const ingredient=v.object({name:v.string(),quantity:v.union(v.number(),v.null()),unit:v.string(),category,note:v.string(),included:v.optional(v.boolean()),choiceGroup:v.optional(v.string())});
export const recipe=v.object({id:v.string(),name:v.string(),servings:v.union(v.number(),v.null()),source:v.union(v.string(),v.null()),sample:v.boolean(),ingredients:v.array(ingredient)});
export const planView=v.object({recipes:v.array(recipe),people:v.number(),checked:v.array(v.string()),status:v.string()});
