import {exactRecipeTerm} from './recipe-language.ts';
const groups={
 '蔬菜水果':'番茄 葱 蒜 姜 土豆 洋葱 胡萝卜 黄瓜 白菜 菠菜 西兰花 芹菜 香菜 生菜 南瓜 青椒 红椒 辣椒 干辣椒 蘑菇 香菇 玉米 豌豆 豆角 柠檬 香蕉 草莓 芹菜茎 红辣椒',
 '肉蛋奶':'鸡蛋 鸡肉 鸡腿肉 鸡胸肉 猪肉 牛肉 羊肉 虾 鱼肉 豆腐 牛奶 奶油 淡奶油 黄油 融化的黄油 奶酪 酸奶 希腊酸奶 酪乳 蛋清',
 '主食干货':'面粉 中筋面粉 大米 米饭 面条 意大利面 淀粉 玉米淀粉 燕麦 花生 芝麻 小扁豆 红扁豆',
 '调味品':'食用油 植物油 橄榄油 芝麻油 盐 粗盐 糖 红糖 冰糖 生抽 老抽 酱油 蚝油 料酒 米醋 醋 胡椒粉 黑胡椒 白胡椒 花椒 八角 番茄酱 豆瓣酱 泡打粉 小苏打 香草精 蜂蜜 枫糖浆 孜然籽 孜然粉 咖喱粉 蔬菜高汤块 蔬菜高汤',
 '其他':'水 沸水',
} as const;
export type FoodCategory=keyof typeof groups;
const categoryByName=new Map<string,FoodCategory>();
for(const [category,names] of Object.entries(groups))for(const name of names.split(' '))categoryByName.set(name,category as FoodCategory);
export function ingredientIdentity(value:string):string{
 const normalized=value.trim().toLowerCase().replace(/\s+/g,' ');const name=exactRecipeTerm(normalized);
 return name&&categoryByName.has(name)?name:normalized;
}
export function ingredientCategory(value:string):FoodCategory{return categoryByName.get(ingredientIdentity(value))??'其他';}
