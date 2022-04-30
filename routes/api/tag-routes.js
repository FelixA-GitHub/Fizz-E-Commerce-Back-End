const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', (req, res) => {
  console.log('======================');
  // find all tags
  Tag.findAll({ include: [Product] }).then(data => { res.json(data) })
  // below is expanded version of Tag.findAll()
  // Tag.findAll({
  //   attributes:
  //     [
  //       'id',
  //       'tag_name'
  //     ],
  //   // be sure to include its associated Product data
  //   include: [
  //     {
  //       model: Product,
  //       attributes: ['id', 'product_name', 'price', 'stock', 'category_id']
  //     }
  //   ]
  // })
  //   .then(dbTagData => {
  //     if (!dbTagData) {
  //       res.status(404).json({ message: 'No tag found with this id' });
  //       return;
  //     }
  //     res.json(dbTagData);
  //   })
  //   .catch(err => {
  //     console.log(err);
  //     res.status(500).json(err);
  //   });
});


router.get('/:id', (req, res) => {
  // find a single tag by its `id`
  Tag.findOne({ where: { id: req.params.id }, include: [Product] }).then(data => res.json(data))
  // below is expanded version of Tag.findOne()
  // Tag.findOne({
  //   where: {
  //     id: req.params.id
  //   },
  //   attributes: [
  //     'id',
  //     'tag_name'
  //   ],
  //   // be sure to include its associated Product data
  //   include: [
  //     {
  //       model: Product,
  //       attributes: ['id', 'product_name', 'price', 'stock', 'category_id']
  //     }
  //   ]
  // })
  // .then(dbTagData => {
  //   if (!dbTagData) {
  //     res.status(404).json({ message: 'No tag found with this id' });
  //     return;
  //   }
  //   res.json(dbTagData);
  // })
  // .catch(err => {
  //   console.log(err);
  //   res.status(500).json(err);
  // });
});

router.post('/', (req, res) => {
  // create a new tag
  Tag.create(
    {
      tag_name: req.body.tag_name,
      tagIds: req.body.tag_id
    }
  )
    .then((tag) => {
      if (req.body.tagIds.length) {
        const tagIdArr = req.body.tagIds.map((tag_name) => {
          return {
            tag_id: tag.id,
            tag_name,
          };
        });
        return tag.bulkCreate(tagIdArr);
      }
      // if no tag tags, just respond
      res.status(200).json(tag);
    })
    .then((tagIds) => res.status(200).json(tagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.put('/:id', (req, res) => {
  // update a tag's name by its `id` value
  Tag.update(req.body, {
    where: {
      id: req.params.id
    }
  })
    .then((product) => {
      // find all associated tags from ProductTag
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      // get list of current tag_ids
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete on tag by its `id` value
  Tag.destroy({
    where: {
      id: req.params.id
    }
  })
    .then(dbTagData => {
      if (!dbTagData) {
        res.status(404).json({ message: 'No tag found with this id' });
        return;
      }
      res.json(dbTagData);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
