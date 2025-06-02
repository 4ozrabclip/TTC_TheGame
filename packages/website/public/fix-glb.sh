for anim in Alpaca Bull Cow Deer Donkey Horse Fox Husky Stag Wolf; do
     /Applications/Blender.app/Contents/MacOS/Blender --background --python ~/fix_gltf.py -- animals/$anim.glb animals/$anim.fixed.glb
done

/Applications/Blender.app/Contents/MacOS/Blender --background --python ~/fix_gltf.py -- Witch.glb Witch.fixed.glb
/Applications/Blender.app/Contents/MacOS/Blender --background --python ~/fix_gltf.py -- Adventurer.glb Adventurer.fixed.glb

# for anim in Alpaca Bull Cow Deer Donkey Horse Fox Husky Stag Wolf; do
#      /Applications/Blender.app/Contents/MacOS/Blender --background --python ~/fix_gltf.py -- animals/$anim.glb animals/$anim.fixed.glb
# done