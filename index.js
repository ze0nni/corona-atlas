const Cli = require('cli')
const Fs = require('fs')
const Path = require('path')

const MaxRectsPacker = require("maxrects-packer").MaxRectsPacker

Cli.withStdinLines(async function(lines, newline) {
	const context = Context(this)
    for (const line of lines) {
    	if (0 == line.trim().length) continue
    	
    	this.debug(`>> ${line}`)
    	const lineArgs = line.trim().split(/\s+/g)
    	const cmdName = lineArgs[0]
    	const cmdArgs = lineArgs.slice(1)
    	const cmd = context[cmdName]
    	if (null == cmd) {
    		throw this.error(`Command <${cmdName}> not found`)
    	}
    	await cmd(...cmdArgs)
    }
    context.buildAtlas()
});

function Context(context) {
	let outputDirectory = "."
	let currentAtlas = null

	function WithAtlas(cmd) {
		return async function (...args) {
			if (null == currentAtlas) {
				throw context.error("Call <atlas> first")
			}
			await cmd(...args)
		}
	}

	function NoAtlasPropertys(propertys, cmd) {
		return async function(...args) {
			for (p of propertys) {
				if (p in currentAtlas) {
					throw context.error(`Current atlas already has <${p}>`)
				}
			}
			await cmd(...args)
		}
	}

	return {
		out,
		atlas,
		buildAtlas,
		config: WithAtlas(config),
		root: WithAtlas(NoAtlasPropertys(["root"], root)),
		size: WithAtlas(NoAtlasPropertys(["width", "height"], size)),
		put: WithAtlas(put)
	}

	async function out(outDir) {
		outputDirectory =  outDir
	}

	async function atlas(name) {
		await buildAtlas()
		currentAtlas = {
			name: name,
			images: []
		}
	}

	async function buildAtlas() {
		if (null == currentAtlas) return
		context.info(`build atlas ${currentAtlas.name}`)

		const Options = {
		    smart: true,
		    pot: true,
		    square: true,
		    allowRotation: false
		};
		const Packer = new MaxRectsPacker(
			currentAtlas.width,
			currentAtlas.height,
			2,
			Options)
		
		Packer.addArray(currentAtlas.images)

		const rects = Packer.bins[0].rects

		const outputImageName = Path.resolve(outputDirectory, currentAtlas.name)
		const outputConfigName = Path.resolve(outputDirectory, currentAtlas.config)

		await context.exec(`convert -size 2048x2048 xc:transparent ${toArgs(rects)} ${outputImageName}`)
		Fs.writeFileSync(outputConfigName, toLua(rects))
	}

	async function config(name) {
		currentAtlas.config = name
	}

	async function size(width, height) {
		currentAtlas.width = width
		currentAtlas.height = height
	}

	async function root(rootPath) {
		currentAtlas.root = rootPath
	}

	async function put(dir) {
		const root = currentAtlas.root
		const newImages = []
		for (let f of Fs.readdirSync(Path.join(root, dir)).filter(isImage)) {
			const fullName = Path.join(root, dir, f)
			const relativeName = Path.relative(root, fullName)
			newImages.push({
				name: relativeName,
				path: fullName
			})
		}
		context.info(`Find ${newImages.length} files in <${dir}>`)
		const progress = cliProgress(context, newImages.length)
		for (let image of newImages) {
			const size = await getImageSize(context, image.path)
			image.width = size.width
			image.height = size.height
			progress()
		}
		currentAtlas.images = [...currentAtlas.images, ...newImages]
	}
}

function isImage(filename) {
	return filename.endsWith(".png") || filename.endsWith(".jpg")
}

async function getImageSize(context, fullName) {
	return new Promise(function(resolve, reject) {
		context.exec(`identify -ping -format "%w %h" ${fullName}`, function(result) {
			const size = result[0].split(' ')
			resolve({
				width: parseInt(size[0]),
				height: parseInt(size[1])
			})
		})
	});
}

function cliProgress(context, total) {
	context.progress(0)
	let times = 0
	return function() {
		times ++
		context.progress(times / total)
	}
}


function toArgs(rects) {
	return rects
		.map(r => `-draw "image over ${r.x},${r.y},${r.width},${r.height} '${r.path}'"`)
		.join(" ")
}

function toLua(rects) {
	return `
local m = {}	

local options = {
	frames = 
	{
${rects.map(toFrame).join(",")}
	}
}

function m.getSheetOptions(self) 
return options
end 

local indexes = {
	${rects.map((f, i) => `["${f.name}"] = ${i}`).join(",\n")}
}

function m.getImageIndex(self, name) 
	local index = indexes[name]
      if nil == index then
            return null
      else 
	     return index + 1
      end
end

function m.getFrame(self, index)
	return options.frames[index]
end

return m
`
}

function toFrame(f) {
	return `		{ -- ${f.name}
			x = ${f.x},
            y = ${f.y},
            width = ${f.width},
            height = ${f.height}
		}`
}